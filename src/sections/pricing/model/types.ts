import type { CSSProperties } from "react";

export interface PriceSectionMetrics {
  top: number;
  distance: number;
}

export interface PriceFlowMetrics extends PriceSectionMetrics {
  edgeDistance: number;
  spacing: number;
}

export type PriceSectionStyle = CSSProperties & {
  "--price-list-slides": number;
};
