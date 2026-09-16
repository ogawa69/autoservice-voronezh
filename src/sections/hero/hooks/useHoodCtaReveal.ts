import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroRefs, HeroStateSetters } from "../types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useHoodCtaReveal({
  refs,
  setters,
  reduceMotion,
  videoFailed,
  engineVideoReady,
  engineHoodOpen,
  hoodRevealRate,
}: {
  refs: HeroRefs;
  setters: Pick<
    HeroStateSetters,
    "setHoodCopyVisible" | "setHoodRevealCycle"
  >;
  reduceMotion: boolean;
  videoFailed: boolean;
  engineVideoReady: boolean;
  engineHoodOpen: boolean;
  hoodRevealRate: number;
}) {
  useGSAP(
    () => {
      const action = refs.hoodActionRef.current;
      const trigger = refs.hoodTriggerRef.current;

      if (!action || !trigger) return undefined;

      if (reduceMotion || videoFailed) {
        setters.setHoodCopyVisible(true);
        gsap.set(action, { clearProps: "all" });
        return undefined;
      }

      if (!engineVideoReady || !engineHoodOpen) {
        refs.hoodTitleRef.current?.reset();
        setters.setHoodCopyVisible(false);
        gsap.set(action, { autoAlpha: 0, y: 14 });
        return undefined;
      }

      let revealFrame = 0;
      let revealed = false;
      const actionDuration = Math.max(0.18, 0.42 / hoodRevealRate);
      const actionDelay = 0.68 / hoodRevealRate;

      const revealContent = () => {
        if (revealed) return;
        revealed = true;
        refs.hoodTitleRef.current?.reset();
        setters.setHoodRevealCycle((cycle) => cycle + 1);
        setters.setHoodCopyVisible(true);
        window.cancelAnimationFrame(revealFrame);
        revealFrame = window.requestAnimationFrame(() =>
          refs.hoodTitleRef.current?.startAnimation(),
        );

        gsap.fromTo(
          action,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: actionDuration,
            delay: actionDelay,
            ease: "power3.out",
            overwrite: true,
          },
        );
      };

      const resetContent = () => {
        revealed = false;
        window.cancelAnimationFrame(revealFrame);
        refs.hoodTitleRef.current?.reset();
        setters.setHoodCopyVisible(false);
        gsap.set(action, { autoAlpha: 0, y: 14 });
      };

      resetContent();

      const contentTrigger = ScrollTrigger.create({
        trigger,
        start: "top 66%",
        onEnter: revealContent,
        onEnterBack: revealContent,
        onLeaveBack: resetContent,
      });

      if (contentTrigger.scroll() >= contentTrigger.start) revealContent();

      return () => {
        window.cancelAnimationFrame(revealFrame);
        contentTrigger.kill();
      };
    },
    {
      scope: refs.sequenceRef,
      dependencies: [
        reduceMotion,
        videoFailed,
        engineVideoReady,
        engineHoodOpen,
        hoodRevealRate,
      ],
      revertOnUpdate: true,
    },
  );
}
