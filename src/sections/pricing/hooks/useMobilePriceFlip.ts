import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { PriceService } from "../types";
import type { PriceSectionMetrics } from "../model/types";
import { REDUCED_MOTION_MEDIA_QUERY } from "../model/constants";
import {
  PRICE_CARD_HALF_TURN_DEGREES,
  PRICE_CARD_MAX_FRAME_DELTA_MS,
  advancePriceCardProgress,
} from "../lib/priceCardMotion";
import {
  clamp,
  readPriceProgress,
  readPriceSectionMetrics,
} from "../lib/priceFlow";

export function useMobilePriceFlip(services: readonly PriceService[]) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<PriceSectionMetrics>({ top: 0, distance: 1 });
  const targetProgressRef = useRef(0);
  const renderedProgressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const frameRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const serviceCount = services.length;
  const activeService = services[activeIndex] ?? services[0];

  const goToService = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      if (!section || serviceCount === 0) return;

      metricsRef.current = readPriceSectionMetrics(section);
      const boundedIndex = clamp(index, 0, serviceCount - 1);

      if (reducedMotionRef.current) {
        activeIndexRef.current = boundedIndex;
        setActiveIndex(boundedIndex);
        rotorRef.current?.style.setProperty("transform", "rotateX(0deg)");
        surfaceRef.current?.style.setProperty("transform", "rotateX(0deg)");
        cardRef.current?.setAttribute(
          "aria-label",
          `Услуга ${boundedIndex + 1} из ${serviceCount}: ${services[boundedIndex].title}, ${services[boundedIndex].price}`,
        );
        return;
      }

      const progress =
        serviceCount === 1 ? 0 : boundedIndex / (serviceCount - 1);

      window.scrollTo({
        top: metricsRef.current.top + metricsRef.current.distance * progress,
        behavior: reducedMotionRef.current ? "auto" : "smooth",
      });
    },
    [serviceCount, services],
  );

  const handleKeyboard = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const previousKeys = ["ArrowLeft", "ArrowUp", "PageUp"];
      const nextKeys = ["ArrowRight", "ArrowDown", "PageDown"];

      if (previousKeys.includes(event.key)) {
        event.preventDefault();
        goToService(activeIndexRef.current - 1);
        return;
      }

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        goToService(activeIndexRef.current + 1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goToService(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        goToService(serviceCount - 1);
      }
    },
    [goToService, serviceCount],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const rotor = rotorRef.current;
    const surface = surfaceRef.current;

    if (!section || !card || !rotor || !surface || serviceCount === 0) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
    reducedMotionRef.current = reducedMotionQuery.matches;
    let disposed = false;
    let previousFrameTime = 0;

    const updateActiveService = (nextIndex: number) => {
      surface.style.transform = reducedMotionRef.current
        ? "rotateX(0deg)"
        : `rotateX(${nextIndex * PRICE_CARD_HALF_TURN_DEGREES}deg)`;
      card.setAttribute(
        "aria-label",
        `Услуга ${nextIndex + 1} из ${serviceCount}: ${services[nextIndex].title}, ${services[nextIndex].price}`,
      );

      if (nextIndex === activeIndexRef.current) return;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    };

    const render = (progress: number) => {
      if (reducedMotionRef.current) {
        rotor.style.transform = "rotateX(0deg)";
        surface.style.transform = "rotateX(0deg)";
        return;
      }

      const raw = progress * (serviceCount - 1);
      const rotateX = raw * PRICE_CARD_HALF_TURN_DEGREES;
      const nextIndex = clamp(Math.round(raw), 0, serviceCount - 1);

      rotor.style.transform = `rotateX(${rotateX.toFixed(2)}deg)`;
      updateActiveService(nextIndex);
    };

    const animate = (frameTime: number) => {
      if (disposed) return;

      if (reducedMotionRef.current) {
        renderedProgressRef.current = targetProgressRef.current;
      } else {
        const deltaMs = previousFrameTime
          ? frameTime - previousFrameTime
          : PRICE_CARD_MAX_FRAME_DELTA_MS;
        renderedProgressRef.current = advancePriceCardProgress({
          renderedProgress: renderedProgressRef.current,
          targetProgress: targetProgressRef.current,
          serviceCount,
          deltaMs,
        });
      }
      previousFrameTime = frameTime;

      render(renderedProgressRef.current);

      if (renderedProgressRef.current !== targetProgressRef.current) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        frameRef.current = 0;
        previousFrameTime = 0;
      }
    };

    const requestRender = () => {
      targetProgressRef.current = readPriceProgress(metricsRef.current);
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const readTargetFromLayout = () => {
      metricsRef.current = readPriceSectionMetrics(section);
      targetProgressRef.current = readPriceProgress(metricsRef.current);
    };

    const initializeFromLayout = () => {
      readTargetFromLayout();
      renderedProgressRef.current = targetProgressRef.current;
      render(renderedProgressRef.current);
    };

    const remeasureTarget = () => {
      if (disposed) return;
      readTargetFromLayout();

      if (
        renderedProgressRef.current !== targetProgressRef.current &&
        !frameRef.current
      ) {
        previousFrameTime = 0;
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      section.toggleAttribute("data-reduced-motion", event.matches);

      if (event.matches) {
        if (frameRef.current) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = 0;
        }
        previousFrameTime = 0;
        rotor.style.transform = "rotateX(0deg)";
        surface.style.transform = "rotateX(0deg)";
        return;
      }

      initializeFromLayout();
    };

    section.toggleAttribute("data-reduced-motion", reducedMotionQuery.matches);
    initializeFromLayout();

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", remeasureTarget);
    window.addEventListener("load", remeasureTarget);
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);
    document.fonts?.addEventListener?.("loadingdone", remeasureTarget);
    document.fonts?.ready.then(remeasureTarget);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(remeasureTarget);
    resizeObserver?.observe(section);

    return () => {
      disposed = true;
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", remeasureTarget);
      window.removeEventListener("load", remeasureTarget);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
      document.fonts?.removeEventListener?.("loadingdone", remeasureTarget);
      resizeObserver?.disconnect();

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [serviceCount, services]);

  return {
    sectionRef,
    cardRef,
    rotorRef,
    surfaceRef,
    activeIndex,
    activeService,
    serviceCount,
    handleKeyboard,
  };
}
