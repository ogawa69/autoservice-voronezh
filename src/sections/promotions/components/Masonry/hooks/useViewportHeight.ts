import { useEffect, useState } from "react";

export function useViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );

  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    const viewport = window.visualViewport;

    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
