import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedContent({
  children,
  container,
  distance = 100,
  direction = "vertical",
  reverse = false,
  duration = 0.8,
  ease = "power3.out",
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = "power3.in",
  onComplete,
  onDisappearanceComplete,
  active,
  as: Component = "div",
  className = "",
  style,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const controlled = typeof active === "boolean";
    const axis = direction === "horizontal" ? "x" : "y";
    const offset = reverse ? -distance : distance;
    const startPercentage = (1 - threshold) * 100;
    const resolvedDuration = reduceMotion ? Math.min(duration, 0.15) : duration;

    let scrollerTarget =
      container || document.getElementById("snap-main-container") || null;
    if (typeof scrollerTarget === "string") {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    gsap.set(element, {
      [axis]: reduceMotion ? 0 : offset,
      scale: reduceMotion ? 1 : scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: "visible",
      willChange: reduceMotion ? "opacity" : "opacity, transform",
    });

    const timeline = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        gsap.set(element, { clearProps: "willChange" });
        onComplete?.();

        if (disappearAfter > 0) {
          gsap.to(element, {
            [axis]: reduceMotion ? 0 : reverse ? distance : -distance,
            scale: reduceMotion ? 1 : 0.8,
            opacity: animateOpacity ? initialOpacity : 0,
            delay: disappearAfter,
            duration: reduceMotion
              ? Math.min(disappearDuration, 0.15)
              : disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          });
        }
      },
    });

    timeline.to(element, {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration: resolvedDuration,
      ease,
    });

    let scrollTrigger;
    if (controlled) {
      if (active) timeline.play();
    } else {
      scrollTrigger = ScrollTrigger.create({
        trigger: element,
        ...(scrollerTarget ? { scroller: scrollerTarget } : {}),
        start: `top ${startPercentage}%`,
        once: true,
        onEnter: () => timeline.play(),
      });
    }

    return () => {
      scrollTrigger?.kill();
      timeline.kill();
      gsap.killTweensOf(element);
    };
  }, [
    active,
    animateOpacity,
    container,
    delay,
    direction,
    disappearAfter,
    disappearDuration,
    disappearEase,
    distance,
    duration,
    ease,
    initialOpacity,
    onComplete,
    onDisappearanceComplete,
    reverse,
    scale,
    threshold,
  ]);

  return (
    <Component
      ref={ref}
      className={className}
      style={{ visibility: "hidden", ...style }}
      {...props}
    >
      {children}
    </Component>
  );
}
