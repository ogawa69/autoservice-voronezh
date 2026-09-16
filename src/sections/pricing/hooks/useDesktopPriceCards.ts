import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { PriceService } from "../types";
import type { PriceFlowMetrics } from "../model/types";
import {
  FLOW_ENTRY_OFFSET,
  FLOW_TRAVEL_EXTRA,
  REDUCED_MOTION_MEDIA_QUERY,
} from "../model/constants";
import {
  clamp,
  readPriceFlowMetrics,
  readPriceFlowProgress,
} from "../lib/priceFlow";
import { renderPriceFlowCards } from "../lib/renderPriceFlowCards";

export function useDesktopPriceCards(services: readonly PriceService[]) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);
  const metricsRef = useRef<PriceFlowMetrics>({
    top: 0,
    distance: 1,
    edgeDistance: 1,
    spacing: 1,
  });
  const targetProgressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const frameRef = useRef(0);
  const jumpToProgressRef = useRef<((progress: number) => void) | null>(null);
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const serviceCount = services.length;
  const travelSpan = serviceCount + FLOW_TRAVEL_EXTRA;

  const showReducedService = useCallback(
    (index: number) => {
      const boundedIndex = clamp(index, 0, serviceCount - 1);
      const cards = cardsRef.current
        .slice(0, serviceCount)
        .filter((card): card is HTMLElement => card !== null);

      cards.forEach((card, cardIndex) => {
        card.style.removeProperty("opacity");
        card.style.removeProperty("filter");
        card.style.removeProperty("z-index");
        card.style.removeProperty("transform");
        card.toggleAttribute("data-active", cardIndex === boundedIndex);
        card.setAttribute("aria-hidden", String(cardIndex !== boundedIndex));
      });

      activeIndexRef.current = boundedIndex;
      setActiveIndex(boundedIndex);
    },
    [serviceCount],
  );

  const goToService = useCallback(
    (index: number, immediate = false) => {
      const section = sectionRef.current;
      const firstCard = cardsRef.current[0];
      if (!section || !firstCard || serviceCount === 0) return;

      const boundedIndex = clamp(index, 0, serviceCount - 1);

      if (reducedMotionRef.current) {
        showReducedService(boundedIndex);
        return;
      }

      metricsRef.current = readPriceFlowMetrics(section, firstCard);
      const sectionProgress =
        serviceCount === 1 ? 0 : boundedIndex / (serviceCount - 1);
      const flowProgress = (boundedIndex + FLOW_ENTRY_OFFSET) / travelSpan;
      const top =
        metricsRef.current.top + metricsRef.current.distance * sectionProgress;

      window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });

      if (immediate) {
        jumpToProgressRef.current?.(flowProgress);
      }
    },
    [serviceCount, showReducedService, travelSpan],
  );

  const handleKeyboard = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const previousKeys = ["ArrowLeft", "ArrowUp", "PageUp"];
      const nextKeys = ["ArrowRight", "ArrowDown", "PageDown"];
      const timeline =
        readPriceFlowProgress(metricsRef.current, serviceCount, travelSpan) *
          travelSpan -
        FLOW_ENTRY_OFFSET;
      const boundaryIndex = timeline < 0 ? 0 : serviceCount - 1;

      if (previousKeys.includes(event.key)) {
        event.preventDefault();
        const previousIndex =
          activeIndexRef.current < 0
            ? boundaryIndex
            : activeIndexRef.current - 1;
        goToService(previousIndex, true);
        return;
      }

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        const nextIndex =
          activeIndexRef.current < 0
            ? boundaryIndex
            : activeIndexRef.current + 1;
        goToService(nextIndex, true);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goToService(0, true);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        goToService(serviceCount - 1, true);
      }
    },
    [goToService, serviceCount, travelSpan],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current
      .slice(0, serviceCount)
      .filter((card): card is HTMLElement => card !== null);
    const firstCard = cards[0];

    if (!section || !firstCard || cards.length !== serviceCount) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
    reducedMotionRef.current = reducedMotionQuery.matches;
    let disposed = false;

    const updateActiveService = (nextIndex: number) => {
      if (nextIndex === activeIndexRef.current) return;

      cards.forEach((card, index) => {
        card.setAttribute("aria-hidden", String(index !== nextIndex));
      });

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    };

    const render = (progress: number) => {
      if (reducedMotionRef.current) return;

      const timeline = progress * travelSpan - FLOW_ENTRY_OFFSET;
      const nearestIndex = renderPriceFlowCards(
        cards,
        metricsRef.current,
        timeline,
      );

      updateActiveService(nearestIndex);
    };

    const jumpToProgress = (progress: number) => {
      targetProgressRef.current = progress;
      render(progress);
    };

    const animate = () => {
      if (disposed || reducedMotionRef.current) {
        frameRef.current = 0;
        return;
      }

      render(targetProgressRef.current);
      frameRef.current = 0;
    };

    const requestRender = () => {
      if (reducedMotionRef.current) return;
      targetProgressRef.current = readPriceFlowProgress(
        metricsRef.current,
        serviceCount,
        travelSpan,
      );
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const measureAndRender = () => {
      if (disposed) return;
      metricsRef.current = readPriceFlowMetrics(section, firstCard);

      if (reducedMotionRef.current) {
        showReducedService(activeIndexRef.current < 0 ? 0 : activeIndexRef.current);
        return;
      }

      jumpToProgress(
        readPriceFlowProgress(metricsRef.current, serviceCount, travelSpan),
      );
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      section.toggleAttribute("data-reduced-motion", event.matches);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }

      if (event.matches) {
        showReducedService(activeIndexRef.current < 0 ? 0 : activeIndexRef.current);
        return;
      }

      measureAndRender();
    };

    section.toggleAttribute("data-reduced-motion", reducedMotionQuery.matches);
    jumpToProgressRef.current = jumpToProgress;
    metricsRef.current = readPriceFlowMetrics(section, firstCard);

    if (reducedMotionQuery.matches) {
      showReducedService(0);
    } else {
      jumpToProgress(
        readPriceFlowProgress(metricsRef.current, serviceCount, travelSpan),
      );
    }

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", measureAndRender);
    window.addEventListener("load", measureAndRender);
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);
    document.fonts?.addEventListener?.("loadingdone", measureAndRender);
    document.fonts?.ready.then(measureAndRender);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureAndRender);
    resizeObserver?.observe(section);
    resizeObserver?.observe(firstCard);
    if (section.previousElementSibling) {
      resizeObserver?.observe(section.previousElementSibling);
    }

    return () => {
      disposed = true;
      jumpToProgressRef.current = null;
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", measureAndRender);
      window.removeEventListener("load", measureAndRender);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
      document.fonts?.removeEventListener?.("loadingdone", measureAndRender);
      resizeObserver?.disconnect();

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [serviceCount, showReducedService, travelSpan]);

  const setCardRef = useCallback((index: number, node: HTMLElement | null) => {
    cardsRef.current[index] = node;
  }, []);

  return {
    sectionRef,
    activeIndex,
    serviceCount,
    setCardRef,
    handleKeyboard,
  };
}
