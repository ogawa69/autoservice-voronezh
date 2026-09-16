import { useEffect, useState } from "react";
import { DESKTOP_PRICE_MEDIA_QUERY } from "../model/constants";

export function useDesktopPriceFlow() {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(DESKTOP_PRICE_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_PRICE_MEDIA_QUERY);
    const sync = () => setDesktop(media.matches);

    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
    } else {
      media.addListener?.(sync);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", sync);
      } else {
        media.removeListener?.(sync);
      }
    };
  }, []);

  return desktop;
}
