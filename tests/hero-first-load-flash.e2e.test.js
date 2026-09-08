import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const APP_URL = process.env.HERO_REPRO_URL ?? "http://127.0.0.1:5173/";
const APP_ADDRESS = new URL(APP_URL);
const VIEWPORT = {
  width: Number(process.env.HERO_REPRO_WIDTH ?? 1440),
  height: Number(process.env.HERO_REPRO_HEIGHT ?? 732),
};
const HERO_INTRO_END_TIME = 5.041667;
const HERO_FRAME_TOLERANCE = 0.25;
const CHROME = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((candidate) => candidate && existsSync(candidate));
const E2E_SKIP_REASON = !CHROME
  ? "Chrome is required for the hero first-load regression test"
  : typeof WebSocket !== "function"
    ? "This Node.js version does not provide the WebSocket client required by the CDP test"
    : false;

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {}, message.sessionId);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(message));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  close() {
    this.socket.close();
  }
}

const waitUntil = async (predicate, timeoutMs, label) => {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      // The server/browser may still be starting.
      lastError = error;
    }
    await delay(20);
  }
  throw new Error(
    `Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ""}`,
  );
};

const withTimeout = async (promise, timeoutMs, message) => {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
};

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });

const appIsReachable = async () => {
  try {
    const response = await fetch(APP_URL, { signal: AbortSignal.timeout(400) });
    return response.ok;
  } catch {
    return false;
  }
};

const startViteIfNeeded = async () => {
  if (await appIsReachable()) return null;
  const port = APP_ADDRESS.port || "5173";
  const vite = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      APP_ADDRESS.hostname,
      "--port",
      port,
      "--strictPort",
    ],
    { cwd: process.cwd(), stdio: "ignore" },
  );
  await waitUntil(appIsReachable, 8_000, APP_URL);
  return vite;
};

const launchChromeOnce = async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "hero-flash-chrome-"));
  const debuggingPort = await getFreePort();
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--autoplay-policy=no-user-gesture-required",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let spawnError;
  chrome.once("error", (error) => {
    spawnError = error;
  });
  let stderr = "";
  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-4_000);
  });
  try {
    const websocketUrl = await waitUntil(async () => {
      if (spawnError) throw spawnError;
      if (chrome.exitCode !== null) {
        throw new Error(`Chrome exited with code ${chrome.exitCode}`);
      }
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`, {
        signal: AbortSignal.timeout(400),
      });
      return (await response.json()).webSocketDebuggerUrl;
    }, 20_000, "Chrome DevTools endpoint");
    return { chrome, profile, websocketUrl };
  } catch (error) {
    const exited =
      chrome.exitCode === null
        ? new Promise((resolve) => chrome.once("exit", resolve))
        : Promise.resolve();
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    await withTimeout(exited, 1_000, "Chrome did not exit").catch(() => {});
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    const detail = stderr.trim();
    throw new Error(`${error.message}${detail ? `\nChrome stderr:\n${detail}` : ""}`);
  }
};

const launchChrome = async () => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await launchChromeOnce();
    } catch (error) {
      lastError = error;
      if (attempt === 0) await delay(250);
    }
  }
  throw lastError;
};

const evaluate = async (cdp, sessionId, expression) => {
  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    { expression, returnByValue: true },
    sessionId,
  );
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
};

test("hero startup avoids first-frame flashes and restored-scroll desync", { timeout: 75_000 }, async (t) => {
  if (E2E_SKIP_REASON) {
    t.skip(E2E_SKIP_REASON);
    return;
  }

  const vite = await startViteIfNeeded();
  if (vite) {
    t.after(async () => {
      if (vite.exitCode !== null) return;
      const exited = new Promise((resolve) => vite.once("exit", resolve));
      vite.kill("SIGTERM");
      await withTimeout(exited, 1_000, "Vite did not exit").catch(() => {});
    });
  }

  const { chrome, profile, websocketUrl } = await launchChrome();
  const cdp = new CdpClient(websocketUrl);
  await cdp.open();
  t.after(async () => {
    cdp.close();
    const exited =
      chrome.exitCode === null
        ? new Promise((resolve) => chrome.once("exit", resolve))
        : Promise.resolve();
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    await withTimeout(exited, 1_000, "Chrome did not exit").catch(() => {});
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { ...VIEWPORT, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );

  const pausedRequestIds = new Set();
  let releaseVideoRequests = false;
  const videoRequestPaused = new Promise((resolve) => {
    cdp.on("Fetch.requestPaused", ({ requestId, request }, eventSessionId) => {
      if (
        eventSessionId === sessionId &&
        request.url.includes("/hero/hero-master-scroll.mp4")
      ) {
        if (releaseVideoRequests) {
          cdp.send("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
          return;
        }
        pausedRequestIds.add(requestId);
        resolve();
      }
    });
  });
  await cdp.send(
    "Fetch.enable",
    { patterns: [{ urlPattern: "*hero-master-scroll.mp4*", requestStage: "Request" }] },
    sessionId,
  );
  await cdp.send("Page.navigate", { url: APP_URL }, sessionId);
  await withTimeout(
    videoRequestPaused,
    6_000,
    "hero master video request was not observed",
  );

  const state = await waitUntil(
    () =>
      evaluate(
        cdp,
        sessionId,
        `(() => {
          const sequence = document.querySelector('.hero-scroll-sequence');
          const stage = document.querySelector('.hero-sequence-stage');
          const fallback = document.querySelector('.hero-image');
          const video = document.querySelector('[data-scrolly-container] video');
          if (
            !sequence ||
            !stage ||
            !fallback ||
            !fallback.complete ||
            fallback.naturalWidth <= 0 ||
            !video
          ) return null;
          const style = getComputedStyle(video);
          const fallbackStyle = getComputedStyle(fallback);
          const stageRect = stage.getBoundingClientRect();
          const fallbackRect = fallback.getBoundingClientRect();
          const rect = video.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return null;
          const paintable = style.display !== 'none' &&
            style.visibility !== 'hidden' && Number(style.opacity) > 0;
          const fallbackPaintable = fallbackStyle.display !== 'none' &&
            fallbackStyle.visibility !== 'hidden' &&
            Number(fallbackStyle.opacity) > 0;
          const fallbackCoversStage = fallbackRect.left <= stageRect.left + 1 &&
            fallbackRect.top <= stageRect.top + 1 &&
            fallbackRect.right >= stageRect.right - 1 &&
            fallbackRect.bottom >= stageRect.bottom - 1;
          return {
            phase: sequence.dataset.sequencePhase,
            engineVideoReady: sequence.dataset.engineVideoReady,
            readyState: video.readyState,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            fallbackSrc: fallback.currentSrc,
            paintable,
            fallbackPaintable,
            fallbackCoversStage,
          };
        })()`,
      ),
    4_000,
    "a laid-out hero video while its network request is paused",
  );

  console.log(JSON.stringify({ symptom: "video is paintable before its first decoded frame", ...state }, null, 2));

  assert.equal(state.engineVideoReady, "false");
  assert.ok(state.readyState < 2, `expected no decoded frame, got readyState=${state.readyState}`);
  assert.equal(state.fallbackPaintable, true, "fallback poster was not visible while video loaded");
  assert.equal(state.fallbackCoversStage, true, "fallback poster did not cover the hero stage");
  assert.equal(
    new URL(state.fallbackSrc).pathname,
    "/hero/service-light-start-16x9-v3.png",
    "animated hero did not use its frame-matched poster",
  );
  assert.equal(
    state.paintable,
    false,
    `first-load flash reproduced: unready hero video is ${state.visibility}, opacity ${state.opacity}, display ${state.display}`,
  );

  await evaluate(
    cdp,
    sessionId,
    `(() => {
      const media = document.querySelector('.hero-media');
      if (!media) return false;
      window.__heroReadyRects = [];
      window.__heroPosterFrameDelta = null;
      window.__heroPosterContentRect = null;
      window.__heroVideoContentRect = null;
      const captureRect = () => {
        const video = document.querySelector('[data-scrolly-container] video');
        if (!video) return;
        const rect = video.getBoundingClientRect();
        window.__heroReadyRects.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          visibility: getComputedStyle(video).visibility,
        });
      };
      const capturePosterFrameDelta = () => {
        const stage = document.querySelector('.hero-sequence-stage');
        const fallback = document.querySelector('.hero-image');
        const video = document.querySelector('[data-scrolly-container] video');
        if (!stage || !fallback || !video || video.readyState < 2) return;
        const stageRect = stage.getBoundingClientRect();
        const fallbackRect = fallback.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        const sampleWidth = 96;
        const sampleHeight = Math.max(
          1,
          Math.round(sampleWidth * stageRect.height / stageRect.width),
        );
        const createCanvas = () => {
          const canvas = document.createElement('canvas');
          canvas.width = sampleWidth;
          canvas.height = sampleHeight;
          return canvas;
        };
        const drawIntoStage = (context, source, contentRect) => {
          const scaleX = sampleWidth / stageRect.width;
          const scaleY = sampleHeight / stageRect.height;
          context.drawImage(
            source,
            (contentRect.left - stageRect.left) * scaleX,
            (contentRect.top - stageRect.top) * scaleY,
            contentRect.width * scaleX,
            contentRect.height * scaleY,
          );
        };

        // The fallback image uses object-fit: cover inside its own overscanned
        // element, while ScrollyVideo sizes the video element itself to cover.
        // Resolve both to their visible stage-space rectangles before comparing.
        const fallbackScale = Math.max(
          fallbackRect.width / fallback.naturalWidth,
          fallbackRect.height / fallback.naturalHeight,
        );
        const fallbackContentWidth = fallback.naturalWidth * fallbackScale;
        const fallbackContentHeight = fallback.naturalHeight * fallbackScale;
        const fallbackContentRect = {
          left: fallbackRect.left + (fallbackRect.width - fallbackContentWidth) / 2,
          top: fallbackRect.top + (fallbackRect.height - fallbackContentHeight) / 2,
          width: fallbackContentWidth,
          height: fallbackContentHeight,
        };
        window.__heroPosterContentRect = fallbackContentRect;
        window.__heroVideoContentRect = {
          left: videoRect.left,
          top: videoRect.top,
          width: videoRect.width,
          height: videoRect.height,
        };
        const posterCanvas = createCanvas();
        const posterContext = posterCanvas.getContext('2d', { willReadFrequently: true });
        drawIntoStage(posterContext, fallback, fallbackContentRect);
        const poster = posterContext.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight,
        ).data;
        const frameCanvas = createCanvas();
        const frameContext = frameCanvas.getContext('2d', { willReadFrequently: true });
        drawIntoStage(frameContext, video, videoRect);
        const frame = frameContext.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight,
        ).data;
        let absoluteError = 0;
        let channelCount = 0;
        for (let index = 0; index < poster.length; index += 4) {
          absoluteError += Math.abs(poster[index] - frame[index]);
          absoluteError += Math.abs(poster[index + 1] - frame[index + 1]);
          absoluteError += Math.abs(poster[index + 2] - frame[index + 2]);
          channelCount += 3;
        }
        window.__heroPosterFrameDelta = absoluteError / channelCount / 255;
      };
      const observer = new MutationObserver(() => {
        if (media.dataset.ready !== 'true') return;
        observer.disconnect();
        capturePosterFrameDelta();
        captureRect();
        let remainingFrames = 5;
        const sampleFrame = () => {
          captureRect();
          remainingFrames -= 1;
          if (remainingFrames > 0) requestAnimationFrame(sampleFrame);
        };
        requestAnimationFrame(sampleFrame);
      });
      observer.observe(media, { attributes: true, attributeFilter: ['data-ready'] });
      return true;
    })()`,
  );

  releaseVideoRequests = true;
  await Promise.all(
    [...pausedRequestIds].map((requestId) =>
      cdp.send("Fetch.continueRequest", { requestId }, sessionId),
    ),
  );
  pausedRequestIds.clear();

  const readyState = await waitUntil(
    () =>
      evaluate(
        cdp,
        sessionId,
        `(() => {
          const sequence = document.querySelector('.hero-scroll-sequence');
          const media = document.querySelector('.hero-media');
          const stage = document.querySelector('.hero-sequence-stage');
          const video = document.querySelector('[data-scrolly-container] video');
          if (
            !sequence ||
            !media ||
            !stage ||
            !video ||
            video.readyState < 2 ||
            media.dataset.ready !== 'true'
          ) return null;
          const style = getComputedStyle(video);
          const stageRect = stage.getBoundingClientRect();
          const videoRect = video.getBoundingClientRect();
          const visible = style.display !== 'none' &&
            style.visibility !== 'hidden' && Number(style.opacity) > 0;
          const coversStage = videoRect.left <= stageRect.left + 1 &&
            videoRect.top <= stageRect.top + 1 &&
            videoRect.right >= stageRect.right - 1 &&
            videoRect.bottom >= stageRect.bottom - 1;
          return {
            engineVideoReady: sequence.dataset.engineVideoReady,
            mediaReady: media.dataset.ready,
            readyState: video.readyState,
            visibility: style.visibility,
            visible,
            coversStage,
            stageBox: {
              x: stageRect.x,
              y: stageRect.y,
              width: stageRect.width,
              height: stageRect.height,
            },
            videoBox: {
              x: videoRect.x,
              y: videoRect.y,
              width: videoRect.width,
              height: videoRect.height,
            },
          };
        })()`,
      ),
    6_000,
    "the first decoded hero frame",
  );

  console.log(JSON.stringify({ handoff: "first decoded frame", ...readyState }, null, 2));

  assert.equal(readyState.mediaReady, "true");
  assert.equal(readyState.visible, true, "ready hero video stayed hidden");
  assert.equal(readyState.coversStage, true, "ready hero video did not cover the stage");

  const posterFrameDelta = await waitUntil(
    () =>
      evaluate(
        cdp,
        sessionId,
        "Number.isFinite(window.__heroPosterFrameDelta) ? window.__heroPosterFrameDelta : null",
      ),
    2_000,
    "a pixel comparison between the poster and first decoded frame",
  );
  assert.ok(
    posterFrameDelta <= 0.03,
    `hero poster changed visibly at the video handoff (normalized MAE ${posterFrameDelta})`,
  );
  const handoffContentRects = await evaluate(
    cdp,
    sessionId,
    `({
      poster: window.__heroPosterContentRect,
      video: window.__heroVideoContentRect,
    })`,
  );
  for (const key of ["left", "top", "width", "height"]) {
    assert.ok(
      Math.abs(handoffContentRects.poster[key] - handoffContentRects.video[key]) <= 1,
      `hero poster ${key} did not match the first video frame`,
    );
  }

  const revealRects = await waitUntil(
    () =>
      evaluate(
        cdp,
        sessionId,
        "window.__heroReadyRects?.length >= 6 ? window.__heroReadyRects : null",
      ),
    2_000,
    "stable video geometry after the media handoff",
  );
  const [firstVisibleRect, ...laterVisibleRects] = revealRects;
  assert.equal(firstVisibleRect.visibility, "visible");
  for (const rect of laterVisibleRects) {
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(
        Math.abs(rect[key] - firstVisibleRect[key]) <= 1,
        `hero video ${key} shifted after becoming visible`,
      );
    }
  }

  const beforeReload = await waitUntil(
    async () => {
      await evaluate(
        cdp,
        sessionId,
        `window.scrollTo(
          0,
          Math.min(3000, document.documentElement.scrollHeight - innerHeight),
        )`,
      );
      return evaluate(
        cdp,
        sessionId,
        `(() => {
          const sequence = document.querySelector('.hero-scroll-sequence');
          if (!sequence || scrollY < 500) return null;
          return {
            phase: sequence.dataset.sequencePhase,
            scrollY,
            timeOrigin: performance.timeOrigin,
          };
        })()`,
      );
    },
    4_000,
    "a deep scroll position before reload",
  );

  await cdp.send(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source: `(() => {
        window.__heroReloadStartupTrace = [];
        const capture = (event) => {
          const sequence = document.querySelector('.hero-scroll-sequence');
          const video = document.querySelector('[data-scrolly-container] video');
          window.__heroReloadStartupTrace.push({
            event,
            phase: sequence?.dataset.sequencePhase,
            scrollY,
            time: performance.now(),
            videoTime: video?.currentTime,
          });
        };
        window.addEventListener('scroll', () => capture('scroll'), { passive: true });
        window.addEventListener('DOMContentLoaded', () => capture('domcontentloaded'));
        window.addEventListener('load', () => capture('load'));
        window.addEventListener('pageshow', () => capture('pageshow'));
        const startedAt = performance.now();
        const captureFrame = () => {
          capture('animationframe');
          if (performance.now() - startedAt < 1800) {
            requestAnimationFrame(captureFrame);
          }
        };
        requestAnimationFrame(captureFrame);
      })();`,
    },
    sessionId,
  );
  await evaluate(
    cdp,
    sessionId,
    `(() => {
      history.scrollRestoration = 'auto';
      return history.scrollRestoration;
    })()`,
  );
  await cdp.send("Page.reload", { ignoreCache: false }, sessionId);
  await waitUntil(
    () =>
      evaluate(
        cdp,
        sessionId,
        `performance.timeOrigin !== ${JSON.stringify(beforeReload.timeOrigin)} &&
          document.readyState !== 'loading'`,
      ),
    6_000,
    "the reloaded document",
  );
  await delay(1_500);

  const afterReload = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const sequence = document.querySelector('.hero-scroll-sequence');
      const video = document.querySelector('[data-scrolly-container] video');
      return {
        historyScrollRestoration: history.scrollRestoration,
        phase: sequence?.dataset.sequencePhase,
        scrollY,
        startupTrace: window.__heroReloadStartupTrace,
        videoTime: video?.currentTime,
      };
    })()`,
  );

  assert.equal(
    afterReload.historyScrollRestoration,
    "manual",
    "reload did not disable native scroll restoration before the app started",
  );
  const desyncedStartupSample = afterReload.startupTrace.find(
    (sample) =>
      Math.abs(sample.scrollY) > 1 ||
      (Number.isFinite(sample.videoTime) &&
        sample.videoTime > HERO_INTRO_END_TIME + HERO_FRAME_TOLERANCE),
  );
  assert.equal(
    desyncedStartupSample,
    undefined,
    `reload briefly restored stale hero state: ${JSON.stringify(desyncedStartupSample)}`,
  );
  assert.ok(
    afterReload.scrollY <= 1,
    `reload restored a deep scroll position (scrollY=${afterReload.scrollY})`,
  );
  assert.ok(
    !Number.isFinite(afterReload.videoTime) ||
      afterReload.videoTime <= HERO_INTRO_END_TIME + HERO_FRAME_TOLERANCE,
    `reload advanced past the hero intro at the top (currentTime=${afterReload.videoTime})`,
  );
});

test("scroll videos recover after transient request failures", { timeout: 45_000 }, async (t) => {
  if (E2E_SKIP_REASON) {
    t.skip(E2E_SKIP_REASON);
    return;
  }

  const vite = await startViteIfNeeded();
  if (vite) {
    t.after(async () => {
      if (vite.exitCode !== null) return;
      const exited = new Promise((resolve) => vite.once("exit", resolve));
      vite.kill("SIGTERM");
      await withTimeout(exited, 1_000, "Vite did not exit").catch(() => {});
    });
  }

  const { chrome, profile, websocketUrl } = await launchChrome();
  const cdp = new CdpClient(websocketUrl);
  await cdp.open();
  t.after(async () => {
    cdp.close();
    const exited =
      chrome.exitCode === null
        ? new Promise((resolve) => chrome.once("exit", resolve))
        : Promise.resolve();
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    await withTimeout(exited, 1_000, "Chrome did not exit").catch(() => {});
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { ...VIEWPORT, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );

  let masterVideoRequests = 0;
  let driveAwayVideoRequests = 0;
  cdp.on("Fetch.requestPaused", ({ requestId, request }, eventSessionId) => {
    if (eventSessionId !== sessionId) return;

    const isMasterVideo = request.url.includes("/hero/hero-master-scroll.mp4");
    const isDriveAwayVideo = request.url.includes("/hero/drive-away-reviews.mp4");
    if (!isMasterVideo && !isDriveAwayVideo) return;

    if (isMasterVideo) masterVideoRequests += 1;
    if (isDriveAwayVideo) driveAwayVideoRequests += 1;
    const requestAttempt = isMasterVideo
      ? masterVideoRequests
      : driveAwayVideoRequests;
    const command =
      requestAttempt === 1
        ? cdp.send(
            "Fetch.failRequest",
            { requestId, errorReason: "ConnectionReset" },
            sessionId,
          )
        : cdp.send("Fetch.continueRequest", { requestId }, sessionId);
    command.catch(() => {});
  });
  await cdp.send(
    "Fetch.enable",
    {
      patterns: [
        { urlPattern: "*hero-master-scroll.mp4*", requestStage: "Request" },
        { urlPattern: "*drive-away-reviews.mp4*", requestStage: "Request" },
      ],
    },
    sessionId,
  );

  await cdp.send("Page.navigate", { url: APP_URL }, sessionId);
  const recovered = await waitUntil(
    async () => {
      const state = await evaluate(
        cdp,
        sessionId,
        `(() => {
          const sequence = document.querySelector('.hero-scroll-sequence');
          const heroVideo = document.querySelector('[data-scrolly-container] video');
          const reviews = document.querySelector('.drive-away-story');
          const driveAwayVideo = document.querySelector('.drive-away-story__video video');
          return {
            heroFailed: sequence?.dataset.videoFailed,
            heroPhase: sequence?.dataset.sequencePhase,
            heroReadyState: heroVideo?.readyState ?? 0,
            driveAwayFailed: reviews?.dataset.videoFailed,
            driveAwayReady: reviews?.dataset.videoReady,
            driveAwayReadyState: driveAwayVideo?.readyState ?? 0,
          };
        })()`,
      );
      return masterVideoRequests >= 2 &&
        driveAwayVideoRequests >= 2 &&
        state.heroFailed === "false" &&
        state.heroReadyState >= 2 &&
        state.driveAwayFailed === "false" &&
        state.driveAwayReady === "true" &&
        state.driveAwayReadyState >= 1
          ? state
          : false;
    },
    12_000,
    "the scroll videos to retry and recover",
  );

  assert.ok(masterVideoRequests >= 2, "the failed video request was not retried");
  assert.ok(driveAwayVideoRequests >= 2, "the failed drive-away video request was not retried");
  assert.equal(recovered.heroFailed, "false");
  assert.ok(recovered.heroReadyState >= 2, "the retried hero video did not decode a frame");
  assert.equal(recovered.driveAwayFailed, "false");
  assert.equal(recovered.driveAwayReady, "true");
});
