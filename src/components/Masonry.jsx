import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

const COLUMN_QUERIES = ["(min-width: 80rem)", "(min-width: 60rem)", "(min-width: 40rem)"];
const COLUMN_VALUES = [4, 3, 2];

function readMatchingValue(queries, values, fallback) {
  if (typeof window === "undefined") return fallback;
  const matchIndex = queries.findIndex((query) => window.matchMedia(query).matches);
  return values[matchIndex] ?? fallback;
}

function useMediaValue(queries, values, fallback) {
  const [value, setValue] = useState(() => readMatchingValue(queries, values, fallback));

  useEffect(() => {
    const mediaQueries = queries.map((query) => window.matchMedia(query));
    const update = () => setValue(readMatchingValue(queries, values, fallback));

    mediaQueries.forEach((query) => query.addEventListener("change", update));
    return () => mediaQueries.forEach((query) => query.removeEventListener("change", update));
  }, [fallback, queries, values]);

  return value;
}

function useMeasure() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

function useViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );

  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    const viewport = window.visualViewport;

    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
    };
  }, []);

  return height;
}

function getEntranceTransform(direction, index) {
  if (direction === "random") {
    const directions = ["top", "bottom", "left", "right"];
    return getEntranceTransform(directions[index % directions.length], index);
  }

  const transforms = {
    top: "translate3d(0, -36%, 0)",
    bottom: "translate3d(0, 36%, 0)",
    left: "translate3d(-28%, 0, 0)",
    right: "translate3d(28%, 0, 0)",
    center: "translate3d(0, 0, 0) scale(0.97)",
  };

  return transforms[direction] ?? transforms.bottom;
}

export function Masonry({
  items,
  renderItem,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.055,
  animateFrom = "bottom",
  exitDuration = 0.2,
  visibleThreshold = 0.5,
  hiddenThreshold = 0.06,
  scaleOnHover = true,
  hoverScale = 0.985,
}) {
  const columns = useMediaValue(COLUMN_QUERIES, COLUMN_VALUES, 1);
  const [containerRef, width] = useMeasure();
  const viewportHeight = useViewportHeight();
  const gap = 12;

  const layout = useMemo(() => {
    if (!width || items.length === 0) return { height: 0, items: [] };

    const columnWidth = Math.max(0, (width - gap * (columns - 1)) / columns);
    const minimumHeight = columns === 1 ? 320 : 260;
    const maximumHeight = viewportHeight
      ? Math.max(minimumHeight, Math.floor(viewportHeight * 1.8))
      : Number.POSITIVE_INFINITY;
    const columnHeights = new Array(columns).fill(0);

    const positionedItems = items.map((item) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const height = Math.min(
        maximumHeight,
        Math.max(minimumHeight, Math.round(columnWidth * item.aspect)),
      );
      const x = column * (columnWidth + gap);
      const y = columnHeights[column];

      columnHeights[column] += height + gap;
      return { ...item, x, y, width: columnWidth, height };
    });

    return {
      items: positionedItems,
      height: Math.max(0, ...columnHeights) - gap,
    };
  }, [columns, items, viewportHeight, width]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || layout.items.length === 0) return undefined;

    const itemElements = Array.from(container.querySelectorAll(".promotion-masonry__item"));
    const pairs = itemElements
      .map((item, index) => ({
        item,
        index,
        card: item.querySelector("[data-masonry-reveal]"),
      }))
      .filter(({ card }) => card);
    const cards = pairs.map(({ card }) => card);
    const pairByItem = new Map(pairs.map((pair) => [pair.item, pair]));
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const states = new WeakMap();
    const focusCleanups = [];
    const focusFrames = new Set();
    const showThreshold = Math.min(1, Math.max(0, visibleThreshold));
    const hideThreshold = Math.min(showThreshold, Math.max(0, hiddenThreshold));
    let observer = null;
    let disposed = false;

    const hiddenTransform = (index) =>
      reducedMotionQuery.matches
        ? "translate3d(0, 0, 0)"
        : getEntranceTransform(animateFrom, index);

    const showCard = (pair, delay = 0, viaFocus = false) => {
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
      if (viaFocus) {
        gsap.set(pair.card, { transform: "translate3d(0, 0, 0)" });
      }
      gsap.set(pair.card, {
        pointerEvents: "auto",
        willChange: "transform, opacity",
      });
      state.tween = gsap.to(pair.card, {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        duration: reducedMotionQuery.matches || viaFocus ? 0.15 : duration,
        ease,
        delay: reducedMotionQuery.matches || viaFocus ? 0 : delay,
        overwrite: true,
        onComplete: () => {
          if (disposed || state.revision !== revision || !state.inView) return;
          state.phase = "shown";
          state.tween = null;
          gsap.set(pair.card, {
            clearProps: "opacity,transform,pointerEvents,willChange",
          });
        },
      });
      pair.item.dataset.masonryVisible = "true";
    };

    const hideCard = (pair) => {
      const state = states.get(pair.item);
      if (disposed || !state || state.phase === "hidden" || state.phase === "hiding") return;

      state.inView = false;
      state.phase = "hiding";
      state.revision += 1;
      const revision = state.revision;

      gsap.killTweensOf(pair.card);
      gsap.set(pair.card, { pointerEvents: "none", willChange: "opacity" });
      state.tween = gsap.to(pair.card, {
        opacity: 0,
        duration: reducedMotionQuery.matches ? 0.15 : exitDuration,
        ease,
        overwrite: true,
        onComplete: () => {
          if (disposed || state.revision !== revision || state.inView) return;
          state.phase = "hidden";
          state.tween = null;
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
        tween: null,
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
        state.inView = true;
        state.phase = "shown";
        pair.item.dataset.masonryVisible = "true";
        gsap.set(pair.card, {
          clearProps: "opacity,transform,pointerEvents,willChange",
        });
      });
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (disposed) return;

          const entering = [];
          const latestEntries = new Map();

          entries.forEach((entry) => {
            const previous = latestEntries.get(entry.target);
            if (!previous || entry.time >= previous.time) latestEntries.set(entry.target, entry);
          });

          latestEntries.forEach((entry) => {
            const pair = pairByItem.get(entry.target);
            const state = states.get(entry.target);
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

      pairs.forEach(({ item }) => observer.observe(item));
    }

    const handleReducedMotionChange = () => {
      if (disposed) return;

      pairs.forEach((pair) => {
        const state = states.get(pair.item);
        if (!state) return;

        state.revision += 1;
        state.tween = null;
        gsap.killTweensOf(pair.card);

        if (state.inView) {
          state.phase = "shown";
          gsap.set(pair.card, {
            clearProps: "opacity,transform,pointerEvents,willChange",
          });
        } else {
          state.phase = "hidden";
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
    duration,
    ease,
    exitDuration,
    hiddenThreshold,
    layout.items.length,
    stagger,
    visibleThreshold,
  ]);

  return (
    <div
      ref={containerRef}
      className={`promotion-masonry${scaleOnHover ? " promotion-masonry--hoverable" : ""}`}
      role="list"
      style={{ height: layout.height, "--masonry-hover-scale": hoverScale }}
    >
      {layout.items.map((item) => (
        <div
          key={item.id}
          className="promotion-masonry__item"
          role="listitem"
          style={{
            width: item.width,
            height: item.height,
            transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
          }}
        >
          <div className="promotion-masonry__reveal" data-masonry-reveal>
            {renderItem(item)}
          </div>
        </div>
      ))}
    </div>
  );
}
