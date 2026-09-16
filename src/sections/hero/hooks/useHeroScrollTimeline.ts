import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ENGINE_VIDEO_END_PROGRESS,
  ENGINE_VIDEO_START_PROGRESS,
  HERO_COPY_EXIT_DURATION,
  HERO_COPY_EXIT_START_PROGRESS,
  HERO_NAV_EXIT_DURATION,
  HERO_NAV_EXIT_START_PROGRESS,
} from "../constants";
import {
  HERO_SEQUENCE_PHASE,
  resolveEngineProgress,
} from "../model/heroSequenceState";
import type { HeroRefs, HeroRuntimeRefs } from "../types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useHeroScrollTimeline({
  refs,
  runtime,
  reduceMotion,
  videoFailed,
}: {
  refs: HeroRefs;
  runtime: HeroRuntimeRefs;
  reduceMotion: boolean;
  videoFailed: boolean;
}) {
  useGSAP(
    () => {
      const sequence = refs.sequenceRef.current;
      const nav = refs.heroNavRef.current;
      const copy = refs.heroCopyRef.current;
      const engineLayer = refs.engineLayerRef.current;
      const animationEnd = refs.animationEndRef.current;

      if (
        !sequence ||
        !nav ||
        !copy ||
        !engineLayer ||
        !animationEnd ||
        reduceMotion ||
        videoFailed
      ) {
        return undefined;
      }

      let syncRaf = 0;
      let pendingProgress = 0;
      let pendingVelocity = 0;
      let latestVelocity = 0;
      let refreshShouldJump = false;

      const applyEngineProgress = () => {
        syncRaf = 0;
        if (runtime.sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.SCRUB) {
          return;
        }
        runtime.engineProgressRef.current = pendingProgress;
        runtime.masterProgressControllerRef.current?.(pendingProgress, {
          velocity: pendingVelocity,
        });
      };

      const syncEngineProgress = (
        scrollProgress: number,
        jump = false,
        velocity = 0,
      ) => {
        const videoProgress = resolveEngineProgress({
          phase: runtime.sequencePhaseRef.current,
          previousProgress: runtime.engineProgressRef.current,
          scrollProgress,
          startProgress: ENGINE_VIDEO_START_PROGRESS,
          endProgress: ENGINE_VIDEO_END_PROGRESS,
        });

        if (runtime.sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.SCRUB) {
          return;
        }

        if (jump) {
          window.cancelAnimationFrame(syncRaf);
          syncRaf = 0;
          runtime.engineProgressRef.current = videoProgress;
          runtime.masterProgressControllerRef.current?.(videoProgress, {
            jump: true,
            velocity,
          });
          return;
        }

        pendingProgress = videoProgress;
        pendingVelocity = velocity;
        if (!syncRaf) {
          syncRaf = window.requestAnimationFrame(applyEngineProgress);
        }
      };

      const timelineProgress = { value: 0 };
      const timeline = gsap.timeline({
        onUpdate: () =>
          syncEngineProgress(
            timelineProgress.value,
            false,
            latestVelocity,
          ),
        scrollTrigger: {
          trigger: sequence,
          start: "top top",
          endTrigger: animationEnd,
          end: "top top",
          scrub: 0.18,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            latestVelocity = self.getVelocity();
          },
          onRefresh: (self) =>
            syncEngineProgress(
              self.progress,
              refreshShouldJump,
              self.getVelocity(),
            ),
        },
      });

      timeline.to(
        timelineProgress,
        { value: 1, duration: 1, ease: "none" },
        0,
      );

      timeline
        .to(
          copy,
          {
            autoAlpha: 0,
            clipPath: "inset(100% 0% 0% 0%)",
            duration: HERO_COPY_EXIT_DURATION,
            ease: "power2.inOut",
          },
          HERO_COPY_EXIT_START_PROGRESS,
        )
        .to(
          nav,
          {
            autoAlpha: 0,
            duration: HERO_NAV_EXIT_DURATION,
            ease: "power3.out",
          },
          HERO_NAV_EXIT_START_PROGRESS,
        )
        .set(engineLayer, { autoAlpha: 1 }, ENGINE_VIDEO_START_PROGRESS);

      const timelineController = {
        disable: () => {
          timeline.scrollTrigger?.disable(false);
          timeline.progress(0).pause();
          runtime.engineProgressRef.current = 0;
        },
        enable: ({ jump = false } = {}) => {
          refreshShouldJump = jump;
          timeline.scrollTrigger?.enable(false, true);
          refreshShouldJump = false;
        },
        showStatic: () => {
          timeline.scrollTrigger?.disable(false);
          timeline.progress(0).pause();
          gsap.set(nav, { clearProps: "opacity,visibility" });
          gsap.set(copy, { clearProps: "opacity,visibility,clipPath" });
          gsap.set(engineLayer, { clearProps: "opacity,visibility" });
        },
      };

      runtime.heroTimelineControllerRef.current = timelineController;
      if (runtime.sequencePhaseRef.current === HERO_SEQUENCE_PHASE.SCRUB) {
        timelineController.enable({ jump: true });
      } else {
        timelineController.disable();
      }

      return () => {
        window.cancelAnimationFrame(syncRaf);
        if (
          runtime.heroTimelineControllerRef.current === timelineController
        ) {
          runtime.heroTimelineControllerRef.current = null;
        }
        timeline.kill();
      };
    },
    {
      scope: refs.sequenceRef,
      dependencies: [reduceMotion, videoFailed],
      revertOnUpdate: true,
    },
  );
}
