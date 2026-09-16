import {
  FLOW_FADE_DISTANCE,
  FLOW_VISIBILITY_RADIUS,
} from "../model/constants";
import type { PriceFlowMetrics } from "../model/types";
import { clamp } from "./priceFlow";

export function renderPriceFlowCards(
  cards: readonly HTMLElement[],
  metrics: PriceFlowMetrics,
  timeline: number,
) {
  let nearestIndex = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card, index) => {
    const distance = index - timeline;
    const absoluteDistance = Math.abs(distance);
    const x = distance * metrics.spacing;
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

  return nearestIndex;
}
