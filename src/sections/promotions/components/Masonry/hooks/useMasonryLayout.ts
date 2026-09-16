import { useMemo } from "react";
import { createMasonryLayout } from "../lib/createMasonryLayout";
import type { MasonryItem } from "../types";
import { useMediaValue } from "./useMediaValue";
import { useViewportHeight } from "./useViewportHeight";

const COLUMN_QUERIES = ["(min-width: 80rem)", "(min-width: 60rem)", "(min-width: 40rem)"];
const COLUMN_VALUES = [4, 3, 2];
const MASONRY_GAP = 12;

export function useMasonryLayout<T extends MasonryItem>(items: readonly T[], width: number) {
  const columns = useMediaValue(COLUMN_QUERIES, COLUMN_VALUES, 1);
  const viewportHeight = useViewportHeight();

  return useMemo(
    () =>
      createMasonryLayout({
        columns,
        gap: MASONRY_GAP,
        items,
        viewportHeight,
        width,
      }),
    [columns, items, viewportHeight, width],
  );
}
