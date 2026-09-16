import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FadeContentProps } from "./types";

gsap.registerPlugin(ScrollTrigger);

const toSeconds = (value: number) =>
  typeof value === "number" && value > 10 ? value / 1000 : value;

export default function FadeContent({
  children,
  container,
  blur = false,
  offsetY = 0,
  duration = 1000,
  ease = "power2.out",
  easing,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = "power2.in",
  onComplete,
  onDisappearanceComplete,
  active,
  className = "",
  style,
  ...props
}: FadeContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      gsap.set(element, {
        autoAlpha: 1,
        filter: "blur(0px)",
        y: 0,
        clearProps: "willChange",
      });
      onComplete?.();
      return () => gsap.killTweensOf(element);
    }

    const candidate =
      container || document.getElementById("snap-main-container") || null;
    const scrollerTarget =
      typeof candidate === "string"
        ? document.querySelector(candidate)
        : candidate;
    const startPercentage = (1 - threshold) * 100;
    const resolvedEase = easing || ease;

    gsap.set(element, {
      autoAlpha: initialOpacity,
      filter: blur ? "blur(10px)" : "blur(0px)",
      y: offsetY,
      willChange: "opacity, filter, transform",
    });

    const timeline = gsap.timeline({
      paused: true,
      delay: toSeconds(delay),
      onComplete: () => {
        gsap.set(element, { clearProps: "willChange" });
        onComplete?.();

        if (disappearAfter > 0) {
          gsap.to(element, {
            autoAlpha: initialOpacity,
            filter: blur ? "blur(10px)" : "blur(0px)",
            y: offsetY,
            delay: toSeconds(disappearAfter),
            duration: toSeconds(disappearDuration),
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          });
        }
      },
    });

    timeline.to(element, {
      autoAlpha: 1,
      filter: "blur(0px)",
      y: 0,
      duration: toSeconds(duration),
      ease: resolvedEase,
    });

    const controlled = typeof active === "boolean";
    const scrollTrigger = controlled
      ? null
      : ScrollTrigger.create({
          trigger: element,
          scroller: scrollerTarget || window,
          start: `top ${startPercentage}%`,
          once: true,
          onEnter: () => timeline.play(),
        });

    if (controlled && active) {
      timeline.play();
    }

    return () => {
      scrollTrigger?.kill();
      timeline.kill();
      gsap.killTweensOf(element);
    };
  }, [
    active,
    blur,
    container,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    duration,
    ease,
    easing,
    initialOpacity,
    offsetY,
    onComplete,
    onDisappearanceComplete,
    threshold,
  ]);

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
}
