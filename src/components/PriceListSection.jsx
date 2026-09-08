import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { priceServices } from "../data/siteContent";
import { ContactTrigger } from "./ContactDialog";
import {
  PRICE_CARD_HALF_TURN_DEGREES,
  PRICE_CARD_MAX_FRAME_DELTA_MS,
  advancePriceCardProgress,
} from "./priceCardMotion";

const HALF_TURN = PRICE_CARD_HALF_TURN_DEGREES;
const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";
const FLOW_ENTRY_OFFSET = 1.16;
const FLOW_TRAVEL_EXTRA = FLOW_ENTRY_OFFSET * 2 - 1;
const FLOW_EDGE_SCROLL_FACTOR = 0.6;
const FLOW_FADE_DISTANCE = 0.4;
const FLOW_VISIBILITY_RADIUS = 1.3;
const FLOW_GAP_SCALE = 0.49;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readMetrics(section) {
  if (!section) return { top: 0, distance: 1 };

  const rect = section.getBoundingClientRect();

  return {
    top: window.scrollY + rect.top,
    distance: Math.max(1, section.offsetHeight - window.innerHeight),
  };
}

function readFlowMetrics(section, card) {
  const metrics = readMetrics(section);
  const cardWidth = card?.offsetWidth || window.innerWidth * 0.392;
  const gap = Math.max(76, window.innerWidth * 0.088) * FLOW_GAP_SCALE;

  return {
    ...metrics,
    edgeDistance: Math.max(1, window.innerHeight * FLOW_EDGE_SCROLL_FACTOR),
    spacing: cardWidth + gap,
  };
}

function readProgress(metrics) {
  return clamp((window.scrollY - metrics.top) / metrics.distance, 0, 1);
}

function readFlowProgress(metrics, serviceCount, travelSpan) {
  const sectionStart = metrics.top;
  const sectionEnd = metrics.top + metrics.distance;
  const lastIndex = Math.max(0, serviceCount - 1);
  let timeline;

  if (window.scrollY < sectionStart) {
    const entryProgress = clamp(
      (window.scrollY - (sectionStart - metrics.edgeDistance)) / metrics.edgeDistance,
      0,
      1,
    );
    timeline = -FLOW_ENTRY_OFFSET * (1 - entryProgress);
  } else if (window.scrollY > sectionEnd) {
    const exitProgress = clamp(
      (window.scrollY - sectionEnd) / metrics.edgeDistance,
      0,
      1,
    );
    timeline = lastIndex + FLOW_ENTRY_OFFSET * exitProgress;
  } else {
    const sectionProgress = clamp(
      (window.scrollY - sectionStart) / metrics.distance,
      0,
      1,
    );
    timeline = sectionProgress * lastIndex;
  }

  return clamp((timeline + FLOW_ENTRY_OFFSET) / travelSpan, 0, 1);
}

function useDesktopPriceFlow() {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const sync = () => setDesktop(media.matches);

    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
    } else {
      media.addListener?.(sync);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", sync);
      } else {
        media.removeListener?.(sync);
      }
    };
  }, []);

  return desktop;
}

function PriceListHeading() {
  return (
    <header className="price-list__heading">
      <h2 id="price-list-title">Стоимость основных работ</h2>
      <p className="price-list__lead">
        Цены указаны за работу. Точную стоимость согласуем после осмотра.
      </p>
    </header>
  );
}

function PriceCardContent({ service }) {
  return (
    <>
      <div className="price-card__copy">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>

      <div className="price-card__price">
        <strong>{service.price}</strong>
        <small>{service.note}</small>
      </div>
    </>
  );
}

function PriceListAction({ flow = false }) {
  return (
    <div className={`price-list__actions${flow ? " price-list__actions--flow" : ""}`}>
      <ContactTrigger className="price-list__all-prices" id="price-list-all-prices-trigger">
        Все цены
        <ArrowUpRight aria-hidden="true" size={20} strokeWidth={2} />
      </ContactTrigger>
    </div>
  );
}

function MobilePriceFlip() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const rotorRef = useRef(null);
  const surfaceRef = useRef(null);
  const metricsRef = useRef({ top: 0, distance: 1 });
  const targetProgressRef = useRef(0);
  const renderedProgressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const frameRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const serviceCount = priceServices.length;
  const activeService = priceServices[activeIndex] ?? priceServices[0];

  const goToService = useCallback(
    (index) => {
      const section = sectionRef.current;
      if (!section || serviceCount === 0) return;

      metricsRef.current = readMetrics(section);
      const boundedIndex = clamp(index, 0, serviceCount - 1);

      if (reducedMotionRef.current) {
        activeIndexRef.current = boundedIndex;
        setActiveIndex(boundedIndex);
        rotorRef.current?.style.setProperty("transform", "rotateX(0deg)");
        surfaceRef.current?.style.setProperty("transform", "rotateX(0deg)");
        cardRef.current?.setAttribute(
          "aria-label",
          `Услуга ${boundedIndex + 1} из ${serviceCount}: ${priceServices[boundedIndex].title}, ${priceServices[boundedIndex].price}`,
        );
        return;
      }

      const progress = serviceCount === 1 ? 0 : boundedIndex / (serviceCount - 1);

      window.scrollTo({
        top: metricsRef.current.top + metricsRef.current.distance * progress,
        behavior: reducedMotionRef.current ? "auto" : "smooth",
      });
    },
    [serviceCount],
  );

  const handleKeyboard = useCallback(
    (event) => {
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

    if (!section || !card || !rotor || !surface || serviceCount === 0) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = reducedMotionQuery.matches;
    let disposed = false;
    let previousFrameTime = 0;

    const updateActiveService = (nextIndex) => {
      surface.style.transform = reducedMotionRef.current
        ? "rotateX(0deg)"
        : `rotateX(${nextIndex * HALF_TURN}deg)`;
      card.setAttribute(
        "aria-label",
        `Услуга ${nextIndex + 1} из ${serviceCount}: ${priceServices[nextIndex].title}, ${priceServices[nextIndex].price}`,
      );

      if (nextIndex === activeIndexRef.current) return;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    };

    const render = (progress) => {
      if (reducedMotionRef.current) {
        rotor.style.transform = "rotateX(0deg)";
        surface.style.transform = "rotateX(0deg)";
        return;
      }

      const raw = progress * (serviceCount - 1);
      const rotateX = raw * HALF_TURN;
      const nextIndex = clamp(Math.round(raw), 0, serviceCount - 1);

      rotor.style.transform = `rotateX(${rotateX.toFixed(2)}deg)`;
      updateActiveService(nextIndex);
    };

    const animate = (frameTime) => {
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
      targetProgressRef.current = readProgress(metricsRef.current);
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(animate);
    };

    const readTargetFromLayout = () => {
      metricsRef.current = readMetrics(section);
      targetProgressRef.current = readProgress(metricsRef.current);
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

    const handleReducedMotionChange = (event) => {
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

    const handleFontsLoaded = () => {
      remeasureTarget();
    };

    section.toggleAttribute("data-reduced-motion", reducedMotionQuery.matches);
    initializeFromLayout();

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", remeasureTarget);
    window.addEventListener("load", remeasureTarget);
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);
    document.fonts?.addEventListener?.("loadingdone", handleFontsLoaded);
    document.fonts?.ready.then(handleFontsLoaded);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remeasureTarget);
    resizeObserver?.observe(section);

    return () => {
      disposed = true;
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", remeasureTarget);
      window.removeEventListener("load", remeasureTarget);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
      document.fonts?.removeEventListener?.("loadingdone", handleFontsLoaded);
      resizeObserver?.disconnect();

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [serviceCount]);

  if (!activeService) return null;

  return (
    <section
      ref={sectionRef}
      id="prices"
      className="price-list price-list--mobile-flip"
      aria-labelledby="price-list-title"
      style={{ "--price-list-slides": serviceCount }}
    >
      <div className="price-list__sticky">
        <PriceListHeading />

        <div
          className="price-list__scene"
          role="region"
          aria-roledescription="карусель"
          aria-label="Цены на услуги автосервиса"
          tabIndex={0}
          onKeyDown={handleKeyboard}
        >
          <article
            ref={cardRef}
            className="price-card"
            data-price-card
            aria-label={`Услуга ${activeIndex + 1} из ${serviceCount}: ${activeService.title}, ${activeService.price}`}
          >
            <div ref={rotorRef} className="price-card__rotor" data-price-rotor>
              <div
                ref={surfaceRef}
                className="price-card__surface"
                data-price-surface
                style={{ transform: `rotateX(${activeIndex * HALF_TURN}deg)` }}
              >
                <PriceCardContent service={activeService} />
              </div>
            </div>
          </article>
        </div>

        <PriceListAction />
      </div>
    </section>
  );
}

function DesktopPriceFlow() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const metricsRef = useRef({ top: 0, distance: 1, edgeDistance: 1, spacing: 1 });
  const targetProgressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const frameRef = useRef(0);
  const jumpToProgressRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const serviceCount = priceServices.length;
  const travelSpan = serviceCount + FLOW_TRAVEL_EXTRA;

  const showReducedService = useCallback(
    (index) => {
      const boundedIndex = clamp(index, 0, serviceCount - 1);
      const cards = cardsRef.current.slice(0, serviceCount).filter(Boolean);

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
    (index, immediate = false) => {
      const section = sectionRef.current;
      const firstCard = cardsRef.current[0];
      if (!section || !firstCard || serviceCount === 0) return;

      const boundedIndex = clamp(index, 0, serviceCount - 1);

      if (reducedMotionRef.current) {
        showReducedService(boundedIndex);
        return;
      }

      metricsRef.current = readFlowMetrics(section, firstCard);
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
    (event) => {
      const previousKeys = ["ArrowLeft", "ArrowUp", "PageUp"];
      const nextKeys = ["ArrowRight", "ArrowDown", "PageDown"];
      const timeline =
        readFlowProgress(metricsRef.current, serviceCount, travelSpan) * travelSpan -
        FLOW_ENTRY_OFFSET;
      const boundaryIndex = timeline < 0 ? 0 : serviceCount - 1;

      if (previousKeys.includes(event.key)) {
        event.preventDefault();
        const previousIndex =
          activeIndexRef.current < 0 ? boundaryIndex : activeIndexRef.current - 1;
        goToService(previousIndex, true);
        return;
      }

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        const nextIndex =
          activeIndexRef.current < 0 ? boundaryIndex : activeIndexRef.current + 1;
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
    const cards = cardsRef.current.slice(0, serviceCount).filter(Boolean);
    const firstCard = cards[0];

    if (!section || !firstCard || cards.length !== serviceCount) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = reducedMotionQuery.matches;
    let disposed = false;

    const updateActiveService = (nextIndex) => {
      if (nextIndex === activeIndexRef.current) return;

      cards.forEach((card, index) => {
        card.setAttribute("aria-hidden", String(index !== nextIndex));
      });

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    };

    const render = (progress) => {
      if (reducedMotionRef.current) return;

      const timeline = progress * travelSpan - FLOW_ENTRY_OFFSET;
      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const distance = index - timeline;
        const absoluteDistance = Math.abs(distance);
        const x = distance * metricsRef.current.spacing;
        const z = -Math.min(absoluteDistance, 1.4) * 215;
        const scale = Math.max(0.76, 1 - absoluteDistance * 0.12);
        const opacity = clamp(
          (FLOW_VISIBILITY_RADIUS - absoluteDistance) / FLOW_FADE_DISTANCE,
          0,
          1,
        );
        const blur = Math.max(0, absoluteDistance - 0.76) * 8;

        card.removeAttribute("data-active");
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = `blur(${blur.toFixed(2)}px)`;
        card.style.zIndex = String(100 - Math.round(absoluteDistance * 10));
        card.style.transform = [
          "translate(-50%, -50%)",
          `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px)`,
          `scale(${scale.toFixed(4)})`,
        ].join(" ");

        if (absoluteDistance < nearestDistance && opacity > 0.5) {
          nearestDistance = absoluteDistance;
          nearestIndex = index;
        }
      });

      updateActiveService(nearestIndex);
    };

    const jumpToProgress = (progress) => {
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
      targetProgressRef.current = readFlowProgress(
        metricsRef.current,
        serviceCount,
        travelSpan,
      );
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(animate);
    };

    const measureAndRender = () => {
      if (disposed) return;
      metricsRef.current = readFlowMetrics(section, firstCard);

      if (reducedMotionRef.current) {
        showReducedService(activeIndexRef.current < 0 ? 0 : activeIndexRef.current);
        return;
      }

      jumpToProgress(readFlowProgress(metricsRef.current, serviceCount, travelSpan));
    };

    const handleReducedMotionChange = (event) => {
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

    const handleFontsLoaded = () => {
      if (!disposed) measureAndRender();
    };

    section.toggleAttribute("data-reduced-motion", reducedMotionQuery.matches);
    jumpToProgressRef.current = jumpToProgress;
    metricsRef.current = readFlowMetrics(section, firstCard);

    if (reducedMotionQuery.matches) {
      showReducedService(0);
    } else {
      jumpToProgress(readFlowProgress(metricsRef.current, serviceCount, travelSpan));
    }

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", measureAndRender);
    window.addEventListener("load", measureAndRender);
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);
    document.fonts?.addEventListener?.("loadingdone", handleFontsLoaded);
    document.fonts?.ready.then(handleFontsLoaded);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureAndRender);
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
      document.fonts?.removeEventListener?.("loadingdone", handleFontsLoaded);
      resizeObserver?.disconnect();

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [serviceCount, showReducedService, travelSpan]);

  if (serviceCount === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="prices"
      className="price-list price-list--desktop-flow"
      aria-labelledby="price-list-title"
      style={{ "--price-list-slides": serviceCount }}
    >
      <div className="price-list__sticky">
        <PriceListHeading />

        <div
          className="price-list__scene price-list__scene--flow"
          role="region"
          aria-roledescription="карусель"
          aria-label="Цены на услуги автосервиса"
          tabIndex={0}
          onKeyDown={handleKeyboard}
        >
          {priceServices.map((service, index) => (
            <article
              key={service.title}
              ref={(node) => {
                cardsRef.current[index] = node;
              }}
              className="price-card price-card--flow"
              data-price-flow-card
              data-active={index === activeIndex ? "true" : undefined}
              aria-hidden={index !== activeIndex}
              aria-label={`Услуга ${index + 1} из ${serviceCount}: ${service.title}, ${service.price}`}
            >
              <div className="price-card__surface">
                <PriceCardContent service={service} />
              </div>
            </article>
          ))}
        </div>

        <div className="price-list__void price-list__void--left" aria-hidden="true" />
        <div className="price-list__void price-list__void--right" aria-hidden="true" />
        <PriceListAction flow />
      </div>
    </section>
  );
}

export function PriceListSection() {
  const desktop = useDesktopPriceFlow();
  return desktop ? <DesktopPriceFlow /> : <MobilePriceFlip />;
}
