import { useLayoutEffect } from "react";
import { CONTACT_MAP_MOBILE_MEDIA_QUERY } from "../model/constants";
import type { ElementRef } from "../types";

interface UseContactMapLayoutOptions {
  embedded: boolean;
  reduceMotion: boolean;
  sectionRef: ElementRef<HTMLElement>;
  detailsRef: ElementRef;
  mapRevealRef: ElementRef;
  frameRef?: ElementRef;
}

export const useContactMapLayout = ({
  embedded,
  reduceMotion,
  sectionRef,
  detailsRef,
  mapRevealRef,
  frameRef,
}: UseContactMapLayoutOptions) => {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const details = detailsRef.current;
    const mapReveal = mapRevealRef.current;
    const frame = frameRef?.current;
    if (!embedded || !section || !details || !mapReveal || !frame) {
      return undefined;
    }

    const mobile = window.matchMedia(CONTACT_MAP_MOBILE_MEDIA_QUERY);
    let resizeFrame = 0;
    const syncMapHeight = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        if (!mobile.matches || reduceMotion) {
          mapReveal.style.removeProperty("--contact-map-top-offset");
          mapReveal.style.removeProperty("--contact-map-fill-height");
          return;
        }

        const frameRect = frame.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        const currentGap =
          mapReveal.offsetTop - (details.offsetTop + details.offsetHeight);
        const mapTopOffset = 32 - currentGap;
        const mapTop =
          sectionRect.top - frameRect.top + mapReveal.offsetTop + mapTopOffset;
        const availableHeight = Math.max(0, frame.clientHeight - mapTop);

        mapReveal.style.setProperty(
          "--contact-map-top-offset",
          `${Math.ceil(mapTopOffset)}px`,
        );
        mapReveal.style.setProperty(
          "--contact-map-fill-height",
          `${Math.ceil(availableHeight)}px`,
        );
      });
    };

    const resizeObserver = new ResizeObserver(syncMapHeight);
    resizeObserver.observe(frame);
    resizeObserver.observe(section);
    resizeObserver.observe(details);
    resizeObserver.observe(mapReveal);
    mobile.addEventListener("change", syncMapHeight);
    window.addEventListener("resize", syncMapHeight);
    window.visualViewport?.addEventListener("resize", syncMapHeight);
    syncMapHeight();

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      mobile.removeEventListener("change", syncMapHeight);
      window.removeEventListener("resize", syncMapHeight);
      window.visualViewport?.removeEventListener("resize", syncMapHeight);
      mapReveal.style.removeProperty("--contact-map-top-offset");
      mapReveal.style.removeProperty("--contact-map-fill-height");
    };
  }, [detailsRef, embedded, frameRef, mapRevealRef, reduceMotion, sectionRef]);
};
