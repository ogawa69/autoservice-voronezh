import type { RefObject } from "react";
import { MASTER_VIDEO_POSTER_SRC } from "../../constants";

type HeroMediaProps = {
  reduceMotion: boolean;
  videoFailed: boolean;
  masterMediaRef: RefObject<HTMLDivElement | null>;
  scrollyContainerRef: RefObject<HTMLDivElement | null>;
};

export function HeroMedia({
  reduceMotion,
  videoFailed,
  masterMediaRef,
  scrollyContainerRef,
}: HeroMediaProps) {
  return (
    <div ref={masterMediaRef} className="hero-media" aria-hidden="true">
      <picture className="hero-video-fallback">
        <source
          media="(max-width: 47.999rem)"
          srcSet={
            reduceMotion
              ? "/hero/mobile-light-portrait.png"
              : MASTER_VIDEO_POSTER_SRC
          }
        />
        <img
          className="hero-image"
          src={reduceMotion ? "/hero/light.png" : MASTER_VIDEO_POSTER_SRC}
          width={reduceMotion ? 1448 : 1920}
          height={reduceMotion ? 1086 : 1080}
          fetchPriority="high"
          alt=""
        />
      </picture>

      {!reduceMotion && !videoFailed && (
        <div ref={scrollyContainerRef} data-scrolly-container />
      )}
    </div>
  );
}
