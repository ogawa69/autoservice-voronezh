import { useEffect, useState } from "react";

const MOBILE_DIALOG_QUERY = "(max-width: 47.999rem)";

export function useMobileDialog() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_DIALOG_QUERY);
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}
