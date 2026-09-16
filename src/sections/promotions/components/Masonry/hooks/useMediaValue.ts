import { useEffect, useState } from "react";

function readMatchingValue<T>(queries: readonly string[], values: readonly T[], fallback: T) {
  if (typeof window === "undefined") return fallback;
  const matchIndex = queries.findIndex((query) => window.matchMedia(query).matches);
  return values[matchIndex] ?? fallback;
}

export function useMediaValue<T>(
  queries: readonly string[],
  values: readonly T[],
  fallback: T,
) {
  const [value, setValue] = useState(() => readMatchingValue(queries, values, fallback));

  useEffect(() => {
    const mediaQueries = queries.map((query) => window.matchMedia(query));
    const update = () => setValue(readMatchingValue(queries, values, fallback));

    mediaQueries.forEach((query) => query.addEventListener("change", update));
    return () => mediaQueries.forEach((query) => query.removeEventListener("change", update));
  }, [fallback, queries, values]);

  return value;
}
