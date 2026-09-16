import type { RefObject } from "react";
import { siteProfile } from "@/content/demo";
import AnimatedContent from "@/shared/ui/AnimatedContent";

type HeroCopyProps = {
  copyRef: RefObject<HTMLDivElement | null>;
  copyVisible: boolean;
  duration: number;
  stagger: number;
  onRevealComplete(): void;
};

export function HeroCopy({
  copyRef,
  copyVisible,
  duration,
  stagger,
  onRevealComplete,
}: HeroCopyProps) {
  return (
    <div ref={copyRef} className="hero-copy min-w-0">
      <AnimatedContent
        active={copyVisible}
        as="h1"
        className="hero-title-reveal"
        direction="horizontal"
        reverse
        distance={24}
        duration={duration}
        delay={stagger}
        id="hero-title"
      >
        Видим то,
        <br />
        что скрыто.
      </AnimatedContent>
      <AnimatedContent
        active={copyVisible}
        className="hero-meta hero-meta-reveal"
        direction="horizontal"
        distance={24}
        duration={duration}
        delay={stagger * 2}
        onComplete={onRevealComplete}
      >
        <p>{siteProfile.heroDescription}</p>
      </AnimatedContent>
    </div>
  );
}
