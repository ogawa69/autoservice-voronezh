import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const APP_URL =
  process.env.PRICE_CARD_REPRO_URL ?? "http://127.0.0.1:5174/";
const APP_ADDRESS = new URL(APP_URL);
const VIEWPORT = { width: 428, height: 926 };
const MAX_SCROLL_STEP_PX = Number(
  process.env.PRICE_CARD_SCROLL_STEP_PX ?? 96,
);
const INJECT_REMEASURE = process.env.PRICE_CARD_INJECT_REMEASURE !== "0";
const MAX_ADJACENT_HEIGHT_DELTA = 0.25;
const EDGE_ON_HEIGHT_RATIO = 0.3;
const CHROME = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((candidate) => candidate && existsSync(candidate));
const E2E_SKIP_REASON = !CHROME
  ? "Chrome is required for the price-card continuity regression test"
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
  const port = APP_ADDRESS.port || "5174";
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

const launchChrome = async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "price-card-chrome-"));
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
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let spawnError;
  let stderr = "";
  chrome.once("error", (error) => {
    spawnError = error;
  });
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
      const response = await fetch(
        `http://127.0.0.1:${debuggingPort}/json/version`,
        { signal: AbortSignal.timeout(400) },
      );
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

const evaluate = async (cdp, sessionId, expression, awaitPromise = false) => {
  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise },
    sessionId,
  );
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return result.value;
};

const identityOf = (sample) =>
  sample.dataIdentity || sample.ariaLabel || sample.textIdentity;

test(
  "mobile price card keeps projected geometry continuous while service content changes",
  { timeout: 45_000 },
  async (t) => {
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
      await rm(profile, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    });

    const { targetId } = await cdp.send("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await cdp.send(
      "Target.attachToTarget",
      { targetId, flatten: true },
    );
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send(
      "Network.setCacheDisabled",
      { cacheDisabled: true },
      sessionId,
    );
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      {
        ...VIEWPORT,
        screenWidth: VIEWPORT.width,
        screenHeight: VIEWPORT.height,
        deviceScaleFactor: 1,
        mobile: true,
      },
      sessionId,
    );
    await cdp.send(
      "Emulation.setTouchEmulationEnabled",
      { enabled: true, maxTouchPoints: 5 },
      sessionId,
    );
    await cdp.send(
      "Emulation.setEmulatedMedia",
      {
        media: "screen",
        features: [
          { name: "prefers-reduced-motion", value: "no-preference" },
        ],
      },
      sessionId,
    );

    await cdp.send("Page.navigate", { url: APP_URL }, sessionId);
    await waitUntil(
      () =>
        evaluate(
          cdp,
          sessionId,
          `(() => {
            const section = document.querySelector('#prices.price-list--mobile-flip');
            const card = section?.querySelector('[data-price-card]');
            const rotor = card?.querySelector('[data-price-rotor]');
            const surface = card?.querySelector('[data-price-surface]');
            return Boolean(
              document.readyState === 'complete' && section && card && rotor && surface
            );
          })()`,
        ),
      12_000,
      "the mobile price card",
    );
    await evaluate(
      cdp,
      sessionId,
      "document.fonts?.ready ?? Promise.resolve()",
      true,
    );

    const metrics = await evaluate(
      cdp,
      sessionId,
      `(() => {
        const section = document.querySelector('#prices');
        const card = section.querySelector('[data-price-card]');
        const rect = section.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const top = scrollY + rect.top;
        const distance = Math.max(1, section.offsetHeight - innerHeight);
        return {
          innerWidth,
          innerHeight,
          top,
          distance,
          end: top + distance,
          faceOnHeight: cardRect.height,
        };
      })()`,
    );

    assert.deepEqual(
      { width: metrics.innerWidth, height: metrics.innerHeight },
      VIEWPORT,
      "CDP did not establish the requested 428x926 CSS viewport",
    );
    assert.ok(metrics.distance > VIEWPORT.height, "price section is not scroll-driven");
    assert.ok(metrics.faceOnHeight > 0, "price card has no measurable face-on height");

    await evaluate(
      cdp,
      sessionId,
      `new Promise((resolve) => {
        window.scrollTo(0, ${metrics.top});
        let remaining = 8;
        const settle = () => {
          remaining -= 1;
          if (remaining > 0) requestAnimationFrame(settle);
          else resolve();
        };
        requestAnimationFrame(settle);
      })`,
      true,
    );

    await evaluate(
      cdp,
      sessionId,
      `(() => {
        window.__priceCardContinuitySamples = [];
        window.__priceCardContinuitySampling = true;
        let frame = 0;
        const rectValue = (rect) => ({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        });
        const sample = () => {
          if (!window.__priceCardContinuitySampling) return;
          const card = document.querySelector('#prices [data-price-card]');
          const rotor = card?.querySelector('[data-price-rotor]');
          const surface = card?.querySelector('[data-price-surface]');
          if (card && rotor && surface) {
            const cardData = { ...card.dataset };
            const rotorData = { ...rotor.dataset };
            const surfaceData = { ...surface.dataset };
            window.__priceCardContinuitySamples.push({
              frame,
              time: performance.now(),
              scrollY,
              ariaLabel: card.getAttribute('aria-label'),
              dataIdentity:
                cardData.priceIdentity ??
                cardData.serviceIdentity ??
                surfaceData.priceIdentity ??
                surfaceData.serviceIdentity ??
                null,
              textIdentity: surface.querySelector('h3')?.textContent?.trim() ?? null,
              data: { card: cardData, rotor: rotorData, surface: surfaceData },
              transform: {
                rotor: rotor.style.transform,
                rotorComputed: getComputedStyle(rotor).transform,
                surface: surface.style.transform,
                surfaceComputed: getComputedStyle(surface).transform,
              },
              box: {
                card: rectValue(card.getBoundingClientRect()),
                rotor: rectValue(rotor.getBoundingClientRect()),
                surface: rectValue(surface.getBoundingClientRect()),
              },
            });
          }
          frame += 1;
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
        return true;
      })()`,
    );

    const drive = await evaluate(
      cdp,
      sessionId,
      `new Promise((resolve) => {
        const start = ${metrics.top};
        const end = ${metrics.end};
        const steps = Math.ceil((end - start) / ${MAX_SCROLL_STEP_PX});
        const remeasureStep = Math.max(3, Math.floor(steps / 3));
        let step = 0;
        const advance = () => {
          step += 1;
          const progress = Math.min(1, step / steps);
          window.scrollTo(0, start + (end - start) * progress);
          if (${INJECT_REMEASURE} && step === remeasureStep) {
            window.__priceCardRemeasureStep = step;
            window.dispatchEvent(new Event('resize'));
          }
          if (step < steps) {
            requestAnimationFrame(advance);
            return;
          }
          let settlingFrames = 90;
          const settle = () => {
            settlingFrames -= 1;
            if (settlingFrames > 0) requestAnimationFrame(settle);
            else resolve({
              steps,
              finalScrollY: scrollY,
              remeasureStep: window.__priceCardRemeasureStep ?? null,
            });
          };
          requestAnimationFrame(settle);
        };
        requestAnimationFrame(advance);
      })`,
      true,
    );

    const samples = await evaluate(
      cdp,
      sessionId,
      `(() => {
        window.__priceCardContinuitySampling = false;
        return window.__priceCardContinuitySamples;
      })()`,
    );

    assert.ok(
      samples.length >= drive.steps,
      `expected at least one sample per driven frame, got ${samples.length}/${drive.steps}`,
    );
    for (let index = 1; index < samples.length; index += 1) {
      assert.ok(
        samples[index].scrollY >= samples[index - 1].scrollY,
        `scroll reversed between frames ${samples[index - 1].frame} and ${samples[index].frame}`,
      );
    }

    const adjacent = samples.slice(1).map((sample, offset) => {
      const previous = samples[offset];
      const previousIdentity = identityOf(previous);
      const identity = identityOf(sample);
      const heightDelta =
        Math.abs(sample.box.surface.height - previous.box.surface.height) /
        metrics.faceOnHeight;
      return {
        index: offset + 1,
        fromFrame: previous.frame,
        toFrame: sample.frame,
        fromTime: previous.time,
        toTime: sample.time,
        frameDurationMs: sample.time - previous.time,
        fromScrollY: previous.scrollY,
        toScrollY: sample.scrollY,
        fromIdentity: previousIdentity,
        toIdentity: identity,
        identityChanged: previousIdentity !== identity,
        fromHeightRatio: previous.box.surface.height / metrics.faceOnHeight,
        toHeightRatio: sample.box.surface.height / metrics.faceOnHeight,
        heightDelta,
        fromTransform: previous.transform,
        toTransform: sample.transform,
      };
    });
    const worstJump = adjacent.reduce(
      (worst, pair) => (pair.heightDelta > worst.heightDelta ? pair : worst),
      adjacent[0],
    );
    const identityTransitions = adjacent.filter((pair) => pair.identityChanged);
    const transitionDiagnostics = identityTransitions.map((transition) => {
      const start = Math.max(0, transition.index - 3);
      const end = Math.min(samples.length, transition.index + 4);
      const nearby = samples.slice(start, end);
      return {
        ...transition,
        minNearbyHeightRatio: Math.min(
          ...nearby.map(
            (sample) => sample.box.surface.height / metrics.faceOnHeight,
          ),
        ),
      };
    });

    console.log(
      JSON.stringify(
        {
          symptom: "price card projected height jumps between adjacent animation frames",
          viewport: VIEWPORT,
          maxScrollStepPx: MAX_SCROLL_STEP_PX,
          injectedRemeasure: INJECT_REMEASURE,
          remeasureStep: drive.remeasureStep,
          drivenFrames: drive.steps,
          sampledFrames: samples.length,
          faceOnHeight: metrics.faceOnHeight,
          maxAdjacentHeightDelta: worstJump,
          identityTransitions: transitionDiagnostics,
        },
        null,
        2,
      ),
    );

    assert.ok(
      transitionDiagnostics.length > 0,
      "the monotonic scroll did not exercise a service identity change",
    );
    if (INJECT_REMEASURE) {
      assert.ok(
        drive.remeasureStep,
        "the mobile remeasure regression probe did not run",
      );
    }
    for (const transition of transitionDiagnostics) {
      assert.ok(
        Math.max(transition.fromHeightRatio, transition.toHeightRatio) <=
          EDGE_ON_HEIGHT_RATIO,
        `service identity changed without an edge-on phase: ${JSON.stringify(transition)}`,
      );
    }
    assert.ok(
      worstJump.heightDelta <= MAX_ADJACENT_HEIGHT_DELTA,
      `price card jumped ${(worstJump.heightDelta * 100).toFixed(1)}% of its face-on height between adjacent rAF samples: ${JSON.stringify(worstJump)}`,
    );
  },
);
