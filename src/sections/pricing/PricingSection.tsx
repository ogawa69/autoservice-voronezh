import { priceServices } from "@/content/demo";
import { DesktopPriceFlow } from "./components/DesktopPriceFlow/DesktopPriceFlow";
import { MobilePriceFlip } from "./components/MobilePriceFlip/MobilePriceFlip";
import { useDesktopPriceFlow } from "./hooks/useDesktopPriceFlow";
import type { PriceService } from "./types";
import "./styles.css";

const services: readonly PriceService[] = priceServices;

export function PricingSection() {
  const desktop = useDesktopPriceFlow();

  return desktop ? (
    <DesktopPriceFlow services={services} />
  ) : (
    <MobilePriceFlip services={services} />
  );
}
