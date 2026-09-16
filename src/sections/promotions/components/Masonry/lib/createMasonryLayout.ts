import type { MasonryItem, MasonryLayout } from "../types";

interface CreateMasonryLayoutOptions<T extends MasonryItem> {
  columns: number;
  gap: number;
  items: readonly T[];
  viewportHeight: number;
  width: number;
}

export function createMasonryLayout<T extends MasonryItem>({
  columns,
  gap,
  items,
  viewportHeight,
  width,
}: CreateMasonryLayoutOptions<T>): MasonryLayout<T> {
  if (!width || items.length === 0) return { height: 0, items: [] };

  const columnWidth = Math.max(0, (width - gap * (columns - 1)) / columns);
  const minimumHeight = columns === 1 ? 320 : 260;
  const maximumHeight = viewportHeight
    ? Math.max(minimumHeight, Math.floor(viewportHeight * 1.8))
    : Number.POSITIVE_INFINITY;
  const columnHeights = new Array<number>(columns).fill(0);

  const positionedItems = items.map((item) => {
    const column = columnHeights.indexOf(Math.min(...columnHeights));
    const height = Math.min(
      maximumHeight,
      Math.max(minimumHeight, Math.round(columnWidth * item.aspect)),
    );
    const x = column * (columnWidth + gap);
    const y = columnHeights[column];

    columnHeights[column] += height + gap;
    return { ...item, x, y, width: columnWidth, height };
  });

  return {
    items: positionedItems,
    height: Math.max(0, ...columnHeights) - gap,
  };
}
