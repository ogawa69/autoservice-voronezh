import { lazy } from "react";
import { HeroSection } from "@/sections/hero";
import { PricingSection } from "@/sections/pricing";
import { DeferredSection } from "@/shared/ui/DeferredSection";
import { DesktopContactDock } from "./components/DesktopContactDock/DesktopContactDock";
import { MobileContactBar } from "./components/MobileContactBar/MobileContactBar";
import { SiteFooter } from "./components/SiteFooter/SiteFooter";
import "./styles.css";

const BrandsSection = lazy(() =>
  import("@/sections/brands").then(({ BrandsSection: Component }) => ({
    default: Component,
  })),
);

const PromotionsSection = lazy(() =>
  import("@/sections/promotions").then(({ PromotionsSection: Component }) => ({
    default: Component,
  })),
);

const DriveAwayStorySection = lazy(() =>
  import("@/sections/drive-away").then(({ DriveAwayStorySection: Component }) => ({
    default: Component,
  })),
);

export function HomePage() {
  return (
    <div id="top" className="site-shell">
      <main>
        <HeroSection />
        <PricingSection />
        <DeferredSection minHeight="12rem">
          <BrandsSection />
        </DeferredSection>
        <DeferredSection minHeight="100svh">
          <PromotionsSection />
        </DeferredSection>
        <DeferredSection
          className="home-deferred-section--drive-away"
          minHeight="440svh"
        >
          <DriveAwayStorySection />
        </DeferredSection>
      </main>

      <SiteFooter />
      <DesktopContactDock />
      <MobileContactBar />
    </div>
  );
}
