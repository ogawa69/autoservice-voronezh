import type { MutableRefObject } from "react";
import type { RevealController } from "../types";

interface TitleRevealSyncOptions {
  controllerRef: MutableRefObject<RevealController | null>;
  startAt: number;
  resetAt: number;
}

export const createTitleRevealSync = ({
  controllerRef,
  startAt,
  resetAt,
}: TitleRevealSyncOptions) => {
  let started = false;
  let revealFrame = 0;

  const sync = (progress: number) => {
    const title = controllerRef.current;
    if (!title) return;

    if (progress >= startAt && !started) {
      started = true;
      title.reset();
      window.cancelAnimationFrame(revealFrame);
      revealFrame = window.requestAnimationFrame(() => title.startAnimation());
    } else if (progress < resetAt && started) {
      started = false;
      window.cancelAnimationFrame(revealFrame);
      title.reset();
    }
  };

  const destroy = () => {
    window.cancelAnimationFrame(revealFrame);
    started = false;
    controllerRef.current?.reset();
  };

  return { sync, destroy };
};
