import { useEffect, useState } from "react";
import { CONTACT_MAP_DESKTOP_MEDIA_QUERY } from "../model/constants";

export const useDesktopContactMapMotion = () => {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(CONTACT_MAP_DESKTOP_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(CONTACT_MAP_DESKTOP_MEDIA_QUERY);
    const sync = () => setDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return desktop;
};
