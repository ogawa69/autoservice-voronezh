import type { CSSProperties } from "react";
import { EngineReveal } from "./components/EngineReveal/EngineReveal";
import { HeroCopy } from "./components/HeroCopy/HeroCopy";
import { HeroMedia } from "./components/HeroMedia/HeroMedia";
import { HeroNavigation } from "./components/HeroNavigation/HeroNavigation";
import {
  HERO_SCROLL_DISTANCE_VH,
  HOOD_CTA_HOLD_DISTANCE_VH,
  HOOD_CTA_TRIGGER_TOP_VH,
} from "./constants";
import { useHeroSequenceController } from "./hooks/useHeroSequenceController";
import { HERO_SEQUENCE_PHASE } from "./model/heroSequenceState";
import "./HeroSection.css";

type HeroStyle = CSSProperties & {
  "--hero-animation-scroll-distance": string;
  "--hood-cta-hold-distance": string;
};

type HoodTriggerStyle = CSSProperties & {
  "--hood-cta-trigger-top": string;
};

export function HeroSection() {
  const controller = useHeroSequenceController();
  const { refs } = controller;

  return (
    <div
      ref={refs.sequenceRef}
      className="hero-scroll-sequence"
      data-hood-static={controller.staticHoodContent}
      data-reduced-motion={controller.reduceMotion}
      data-video-failed={controller.videoFailed}
      data-engine-video-ready={
        controller.engineVideoReady || controller.staticHoodContent
      }
      data-intro-complete={
        controller.introComplete || controller.staticHoodContent
      }
      data-sequence-phase={
        controller.staticHoodContent
          ? HERO_SEQUENCE_PHASE.FALLBACK
          : controller.sequencePhase
      }
      style={
        {
          "--hero-animation-scroll-distance": `${HERO_SCROLL_DISTANCE_VH}svh`,
          "--hood-cta-hold-distance": `${HOOD_CTA_HOLD_DISTANCE_VH}svh`,
        } as HeroStyle
      }
    >
      <span
        ref={refs.animationEndRef}
        className="hero-animation-end"
        aria-hidden="true"
      />
      <span
        ref={refs.hoodTriggerRef}
        className="hood-cta-trigger"
        style={
          {
            "--hood-cta-trigger-top": `${HOOD_CTA_TRIGGER_TOP_VH}svh`,
          } as HoodTriggerStyle
        }
        aria-hidden="true"
      />

      <div className="hero-sequence-stage">
        <section
          className="hero relative grid min-w-0"
          data-copy-visible={controller.copyVisible}
          aria-labelledby="hero-title"
        >
          <HeroMedia
            reduceMotion={controller.reduceMotion}
            videoFailed={controller.videoFailed}
            masterMediaRef={refs.masterMediaRef}
            scrollyContainerRef={refs.scrollyContainerRef}
          />
          <HeroNavigation
            navRef={refs.heroNavRef}
            copyVisible={controller.copyVisible}
            copyRevealDurationSeconds={
              controller.copyRevealDurationSeconds
            }
          />
          <HeroCopy
            copyRef={refs.heroCopyRef}
            copyVisible={controller.copyVisible}
            duration={controller.copyRevealDurationSeconds}
            stagger={controller.copyRevealStaggerSeconds}
            onRevealComplete={controller.handleHeroCopyRevealComplete}
          />
        </section>

        <EngineReveal
          engineLayerRef={refs.engineLayerRef}
          staticContent={controller.staticHoodContent}
          titleRef={refs.hoodTitleRef}
          actionRef={refs.hoodActionRef}
          revealRate={controller.hoodRevealRate}
          copyVisible={controller.hoodCopyVisible}
          revealCycle={controller.hoodRevealCycle}
        />
      </div>
    </div>
  );
}
