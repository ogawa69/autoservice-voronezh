import { useCallback, useEffect, useState } from "react";

export function useNearViewport(rootMargin: string) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  const targetRef = useCallback((node: HTMLElement | null) => {
    setTarget(node);
  }, []);

  useEffect(() => {
    if (!target || isNearViewport) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isNearViewport, rootMargin, target]);

  return { isNearViewport, targetRef };
}
