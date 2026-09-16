import { useCallback, useEffect, useRef } from "react";

interface SwiperAutoplayController {
  paused: boolean;
  running: boolean;
  resume: () => void;
  start: () => void;
}

interface BrandSwiperController {
  autoplay?: SwiperAutoplayController;
  destroyed?: boolean;
}

export function useBrandPlayback(reduceMotion: boolean) {
  const swiperRef = useRef<BrandSwiperController | null>(null);

  const syncPlayback = useCallback(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed || reduceMotion || document.hidden) return;

    if (!swiper.autoplay?.running) swiper.autoplay?.start();
    if (swiper.autoplay?.paused) swiper.autoplay?.resume();
  }, [reduceMotion]);

  const attachSwiper = useCallback(
    (swiper: BrandSwiperController) => {
      swiperRef.current = swiper;
      window.requestAnimationFrame(syncPlayback);
    },
    [syncPlayback],
  );

  useEffect(() => {
    const resumeWhenVisible = () => {
      if (!document.hidden) syncPlayback();
    };
    const watchdog = window.setInterval(syncPlayback, 2200);

    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("focus", resumeWhenVisible);
    window.addEventListener("pageshow", resumeWhenVisible);
    syncPlayback();

    return () => {
      window.clearInterval(watchdog);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("focus", resumeWhenVisible);
      window.removeEventListener("pageshow", resumeWhenVisible);
    };
  }, [syncPlayback]);

  return attachSwiper;
}
