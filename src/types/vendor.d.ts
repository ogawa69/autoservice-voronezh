declare module "scrolly-video/dist/ScrollyVideo.js" {
  type ScrollyVideoOptions = {
    src: string;
    scrollyVideoContainer: HTMLElement;
    transitionSpeed?: number;
    frameThreshold?: number;
    cover?: boolean;
    sticky?: boolean;
    full?: boolean;
    trackScroll?: boolean;
    lockScroll?: boolean;
    useWebCodecs?: boolean;
  };

  export default class ScrollyVideo {
    constructor(options: ScrollyVideoOptions);

    video: HTMLVideoElement;
    currentTime: number;
    targetTime: number;
    videoPercentage: number;
    transitioningRaf: number | null;

    resize(): void;
    destroy(): void;
    setVideoPercentage(
      percentage: number,
      options?: { jump?: boolean; transitionSpeed?: number },
    ): void;
  }
}
