import type { RefObject } from "react";
import { HoodCta } from "../HoodCta/HoodCta";
import type { RevealHandle } from "../../types";

type EngineRevealProps = {
  engineLayerRef: RefObject<HTMLElement | null>;
  staticContent: boolean;
  titleRef: RefObject<RevealHandle | null>;
  actionRef: RefObject<HTMLDivElement | null>;
  revealRate: number;
  copyVisible: boolean;
  revealCycle: number;
};

export function EngineReveal({
  engineLayerRef,
  staticContent,
  titleRef,
  actionRef,
  revealRate,
  copyVisible,
  revealCycle,
}: EngineRevealProps) {
  return (
    <section
      ref={engineLayerRef}
      className="hero-engine-layer"
      aria-labelledby="scroll-service-title"
    >
      {staticContent && (
        <div className="scroll-video-media" aria-hidden="true">
          <img
            className="scroll-video-poster"
            src="/hero/engine-reveal-poster.jpg"
            width="1080"
            height="1916"
            loading="eager"
            alt=""
          />
        </div>
      )}

      <HoodCta
        staticContent={staticContent}
        titleRef={titleRef}
        actionRef={actionRef}
        revealRate={revealRate}
        copyVisible={copyVisible}
        revealCycle={revealCycle}
      />
    </section>
  );
}
