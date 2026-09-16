import type { MasonryAnimationOrigin } from "../types";

const entranceTransforms: Record<Exclude<MasonryAnimationOrigin, "random">, string> = {
  top: "translate3d(0, -36%, 0)",
  bottom: "translate3d(0, 36%, 0)",
  left: "translate3d(-28%, 0, 0)",
  right: "translate3d(28%, 0, 0)",
  center: "translate3d(0, 0, 0) scale(0.97)",
};

const randomDirections = ["top", "bottom", "left", "right"] as const;

export function getEntranceTransform(direction: MasonryAnimationOrigin, index: number) {
  if (direction === "random") {
    return entranceTransforms[randomDirections[index % randomDirections.length]];
  }

  return entranceTransforms[direction] ?? entranceTransforms.bottom;
}
