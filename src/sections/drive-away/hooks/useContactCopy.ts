import { useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ElementRef } from "../types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface UseContactCopyOptions {
  sectionRef: ElementRef<HTMLElement>;
  controlled: boolean;
  active?: boolean;
  reduceMotion: boolean;
}

export const useContactCopy = ({
  sectionRef,
  controlled,
  active,
  reduceMotion,
}: UseContactCopyOptions) => {
  const [copyVisible, setCopyVisible] = useState(false);
  const [copyCycle, setCopyCycle] = useState(0);

  useEffect(() => {
    if (!controlled) return;
    const frame = window.requestAnimationFrame(() => {
      if (reduceMotion) {
        setCopyVisible(true);
      } else if (active) {
        setCopyCycle((cycle) => cycle + 1);
        setCopyVisible(true);
      } else {
        setCopyVisible(false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active, controlled, reduceMotion]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || controlled) return undefined;
      if (reduceMotion) {
        setCopyVisible(true);
        return undefined;
      }

      setCopyVisible(false);
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 72%",
        once: true,
        onEnter: () => {
          setCopyCycle((cycle) => cycle + 1);
          setCopyVisible(true);
        },
      });

      return () => trigger.kill();
    },
    {
      scope: sectionRef,
      dependencies: [controlled, reduceMotion],
      revertOnUpdate: true,
    },
  );

  return {
    copyCycle,
    showContactCopy: reduceMotion || copyVisible,
  };
};
