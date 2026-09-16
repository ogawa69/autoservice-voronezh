export function splitBrandRows(items: readonly string[]) {
  const splitIndex = Math.ceil(items.length / 2);

  return [items.slice(0, splitIndex), items.slice(splitIndex)] as const;
}
