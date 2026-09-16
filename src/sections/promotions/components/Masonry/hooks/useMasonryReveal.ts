import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { getEntranceTransform } from "../lib/getEntranceTransform";
import type { MasonryRevealOptions } from "../types";

interface RevealPair {
  card: HTMLElement;
  index: number;
  item: HTMLElement;
}

interface RevealState {
  inView: boolean;
  phase: "hidden" | "hiding" | "showing" | "shown";
  ratio: number;
  revision: number;
}

export function useMasonryReveal({
  animateFrom,
  containerRef,
  duration,
  ease,
  exitDuration,
  hiddenThreshold,
  itemCount,
  stagger,
  visibleThreshold,
}: MasonryRevealOptions) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || itemCount === 0) return undefined;

    const pairs = Array.from(
      container.querySelectorAll<HTMLElement>(".promotion-masonry__item"),
    )
      .map((item, index) => ({
        item,
        index,
        card: item.querySelector<HTMLElement>("[data-masonry-reveal]"),
      }))
      .filter((pair): pair is RevealPair => pair.card !== null);
    const cards = pairs.map(({ card }) => card);
    const pairByItem = new Map(pairs.map((pair) => [pair.item, pair]));
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const states = new WeakMap<HTMLElement, RevealState>();
    const focusCleanups: Array<() => void> = [];
    const focusFrames = new Set<number>();
    const showThreshold = Math.min(1, Math.max(0, visibleThreshold));
    const hideThreshold = Math.min(showThreshold, Math.max(0, hiddenThreshold));
    let observer: IntersectionObserver | null = null;
    let disposed = false;

    const hiddenTransform = (index: number) =>
      reducedMotionQuery.matches
        ? "translate3d(0, 0, 0)"
        : getEntranceTransform(animateFrom, index);

    const showCard = (pair: RevealPair, delay = 0, viaFocus = false) => {
      const state = states.get(pair.item);
      if (
        disposed ||
        !state ||
        state.phase === "shown" ||
        (!viaFocus && state.phase === "showing")
      ) {
        return;
      }

      state.inView = true;
      state.phase = "showing";
      state.revision += 1;
      const revision = state.revision;

      gsap.killTweensOf(pair.card);
      if (viaFocus) gsap.set(pair.card, { transform: "translate3d(0, 0, 0)" });
      gsap.set(pair.card, { pointerEvents: "auto", willChange: "transform, opacity" });
      gsap.to(pair.card, {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        duration: reducedMotionQuery.matches || viaFocus ? 0.15 : duration,
        ease,
        delay: reducedMotionQuery.matches || viaFocus ? 0 : delay,
        overwrite: true,
        onComplete: () => {
          if (disposed || state.revision !== revision || !state.inView) return;
          state.phase = "shown";
          gsap.set(pair.card, {
            clearProps: "opacity,transform,pointerEvents,willChange",
          });
        },
      });
      pair.item.dataset.masonryVisible = "true";
    };

    const hideCard = (pair: RevealPair) => {
      const state = states.get(pair.item);
      if (disposed || !state || state.phase === "hidden" || state.phase === "hiding") return;

      state.inView = false;
      state.phase = "hiding";
      state.revision += 1;
      const revision = state.revision;

      gsap.killTweensOf(pair.card);
      gsap.set(pair.card, { pointerEvents: "none", willChange: "opacity" });
      gsap.to(pair.card, {
        opacity: 0,
        duration: reducedMotionQuery.matches ? 0.15 : exitDuration,
        ease,
        overwrite: true,
        onComplete: () => {
          if (disposed || state.revision !== revision || state.inView) return;
          state.phase = "hidden";
          gsap.set(pair.card, { clearProps: "willChange" });
          gsap.set(pair.card, {
            opacity: 0,
            transform: hiddenTransform(pair.index),
            pointerEvents: "none",
          });
        },
      });
      pair.item.dataset.masonryVisible = "false";
    };

    pairs.forEach((pair) => {
      states.set(pair.item, {
        inView: false,
        phase: "hidden",
        ratio: 0,
        revision: 0,
      });
      gsap.set(pair.card, {
        opacity: 0,
        transform: hiddenTransform(pair.index),
        pointerEvents: "none",
      });
      pair.item.dataset.masonryVisible = "false";

      const handleFocusIn = () => showCard(pair, 0, true);
      const handleFocusOut = () => {
        const frame = requestAnimationFrame(() => {
          focusFrames.delete(frame);
          const state = states.get(pair.item);
          if (disposed || !state || pair.item.contains(document.activeElement)) return;
          if (state.ratio <= hideThreshold) hideCard(pair);
        });
        focusFrames.add(frame);
      };

      pair.item.addEventListener("focusin", handleFocusIn);
      pair.item.addEventListener("focusout", handleFocusOut);
      focusCleanups.push(() => {
        pair.item.removeEventListener("focusin", handleFocusIn);
        pair.item.removeEventListener("focusout", handleFocusOut);
      });
    });

    if (typeof IntersectionObserver === "undefined") {
      pairs.forEach((pair) => {
        const state = states.get(pair.item);
        if (!state) return;
        state.inView = true;
        state.phase = "shown";
        pair.item.dataset.masonryVisible = "true";
        gsap.set(pair.card, { clearProps: "opacity,transform,pointerEvents,willChange" });
      });
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (disposed) return;

          const entering: RevealPair[] = [];
          const latestEntries = new Map<Element, IntersectionObserverEntry>();
          entries.forEach((entry) => {
            const previous = latestEntries.get(entry.target);
            if (!previous || entry.time >= previous.time) latestEntries.set(entry.target, entry);
          });

          latestEntries.forEach((entry) => {
            const pair = pairByItem.get(entry.target as HTMLElement);
            const state = states.get(entry.target as HTMLElement);
            if (!pair || !state) return;

            state.ratio = entry.intersectionRatio;
            const containsFocus = entry.target.contains(document.activeElement);
            if (containsFocus || entry.intersectionRatio >= showThreshold) {
              if (!state.inView) entering.push(pair);
              return;
            }
            if ((!entry.isIntersecting || entry.intersectionRatio <= hideThreshold) && state.inView) {
              hideCard(pair);
            }
          });

          entering
            .sort((a, b) => a.index - b.index)
            .forEach((pair, order) => {
              const state = states.get(pair.item);
              const containsFocus = pair.item.contains(document.activeElement);
              if (state && (containsFocus || state.ratio >= showThreshold)) {
                showCard(pair, order * stagger, containsFocus);
              }
            });
        },
        { threshold: [0, hideThreshold, showThreshold, 1] },
      );
      pairs.forEach(({ item }) => observer?.observe(item));
    }

    const handleReducedMotionChange = () => {
      if (disposed) return;
      pairs.forEach((pair) => {
        const state = states.get(pair.item);
        if (!state) return;
        state.revision += 1;
        gsap.killTweensOf(pair.card);
        state.phase = state.inView ? "shown" : "hidden";

        if (state.inView) {
          gsap.set(pair.card, { clearProps: "opacity,transform,pointerEvents,willChange" });
        } else {
          gsap.set(pair.card, { clearProps: "willChange" });
          gsap.set(pair.card, {
            opacity: 0,
            transform: hiddenTransform(pair.index),
            pointerEvents: "none",
          });
        }
      });
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    return () => {
      disposed = true;
      observer?.takeRecords();
      observer?.disconnect();
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      focusCleanups.forEach((cleanup) => cleanup());
      focusFrames.forEach((frame) => cancelAnimationFrame(frame));
      gsap.killTweensOf(cards);
      pairs.forEach(({ item, card }) => {
        delete item.dataset.masonryVisible;
        gsap.set(card, { clearProps: "opacity,transform,pointerEvents,willChange" });
      });
    };
  }, [
    animateFrom,
    containerRef,
    duration,
    ease,
    exitDuration,
    hiddenThreshold,
    itemCount,
    stagger,
    visibleThreshold,
  ]);
}
