import type { RefObject } from "react";
import Typewriter from "@/shared/ui/Typewriter";
import VerticalCutReveal from "@/shared/ui/VerticalCutReveal";
import { ContactTrigger } from "@/features/contact-request";
import { InteractiveHoverButton } from "@/shared/ui/InteractiveHoverButton";
import { HOOD_CTA_DESCRIPTION } from "../../constants";
import type { RevealHandle } from "../../types";

type HoodCtaProps = {
  staticContent: boolean;
  titleRef: RefObject<RevealHandle | null>;
  actionRef: RefObject<HTMLDivElement | null>;
  revealRate: number;
  copyVisible: boolean;
  revealCycle: number;
};

export function HoodCta({
  staticContent,
  titleRef,
  actionRef,
  revealRate,
  copyVisible,
  revealCycle,
}: HoodCtaProps) {
  return (
    <div className="hood-cta">
      <h2 id="scroll-service-title" className="hood-cta-title">
        {staticContent ? (
          "Начнём с точной диагностики"
        ) : (
          <VerticalCutReveal
            ref={titleRef}
            autoStart={false}
            splitBy="words"
            staggerDuration={0.075 / revealRate}
            staggerFrom="first"
            transition={{
              type: "spring",
              duration: Math.max(0.2, 0.5 / revealRate),
              bounce: 0.2,
            }}
            containerClassName="hood-cta-title-reveal"
          >
            Начнём с точной диагностики
          </VerticalCutReveal>
        )}
      </h2>

      <div className="hood-cta-description">
        {staticContent ? (
          <p>{HOOD_CTA_DESCRIPTION}</p>
        ) : copyVisible ? (
          <Typewriter
            key={revealCycle}
            as="p"
            text={HOOD_CTA_DESCRIPTION}
            speed={Math.max(8, Math.round(24 / revealRate))}
            initialDelay={Math.max(60, Math.round(180 / revealRate))}
            loop={false}
            showCursor={false}
          />
        ) : (
          <p className="hood-cta-description-placeholder" aria-hidden="true">
            {HOOD_CTA_DESCRIPTION}
          </p>
        )}
      </div>

      <div ref={actionRef} className="hood-cta-action">
        <InteractiveHoverButton
          as={ContactTrigger}
          className="hood-contact-button"
          id="scroll-service-contact-trigger"
        >
          Связаться
        </InteractiveHoverButton>
      </div>
    </div>
  );
}
