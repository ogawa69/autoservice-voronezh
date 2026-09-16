import {
  FLOW_EDGE_SCROLL_FACTOR,
  FLOW_ENTRY_OFFSET,
  FLOW_GAP_SCALE,
} from "../model/constants";
import type { PriceFlowMetrics, PriceSectionMetrics } from "../model/types";

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function readPriceSectionMetrics(
  section: HTMLElement | null,
): PriceSectionMetrics {
  if (!section) return { top: 0, distance: 1 };

  const rect = section.getBoundingClientRect();

  return {
    top: window.scrollY + rect.top,
    distance: Math.max(1, section.offsetHeight - window.innerHeight),
  };
}

export function readPriceFlowMetrics(
  section: HTMLElement,
  card: HTMLElement | null,
): PriceFlowMetrics {
  const metrics = readPriceSectionMetrics(section);
  const cardWidth = card?.offsetWidth || window.innerWidth * 0.392;
  const gap = Math.max(76, window.innerWidth * 0.088) * FLOW_GAP_SCALE;

  return {
    ...metrics,
    edgeDistance: Math.max(1, window.innerHeight * FLOW_EDGE_SCROLL_FACTOR),
    spacing: cardWidth + gap,
  };
}

export function readPriceProgress(metrics: PriceSectionMetrics) {
  return clamp((window.scrollY - metrics.top) / metrics.distance, 0, 1);
}

export function readPriceFlowProgress(
  metrics: PriceFlowMetrics,
  serviceCount: number,
  travelSpan: number,
) {
  const sectionStart = metrics.top;
  const sectionEnd = metrics.top + metrics.distance;
  const lastIndex = Math.max(0, serviceCount - 1);
  let timeline: number;

  if (window.scrollY < sectionStart) {
    const entryProgress = clamp(
      (window.scrollY - (sectionStart - metrics.edgeDistance)) /
        metrics.edgeDistance,
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
