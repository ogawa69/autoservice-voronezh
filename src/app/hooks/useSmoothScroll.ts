import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { ScrollController } from "@/features/contact-request";

gsap.registerPlugin(ScrollTrigger);

export function useSmoothScroll() {
  const lenisRef = useRef<ScrollController | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 40rem)").matches;

    if (reduceMotion || !isDesktop) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      anchors: true,
      smoothWheel: true,
      virtualScroll: () =>
        document.documentElement.dataset.heroIntroLocked !== "true",
      prevent: (node) =>
        node instanceof Element && Boolean(node.closest("[data-lenis-prevent]")),
    });
    const updateScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);

    lenisRef.current = lenis;
    lenis.on("scroll", updateScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", updateScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
