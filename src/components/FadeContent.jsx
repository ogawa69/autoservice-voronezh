import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const toSeconds = (value) =>
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
}) {
  const ref = useRef(null);

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

    let scrollerTarget =
      container || document.getElementById("snap-main-container") || null;
    if (typeof scrollerTarget === "string") {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

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
  }, [active]);

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
}
