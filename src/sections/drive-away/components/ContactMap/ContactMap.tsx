import { ArrowUpRight } from "lucide-react";
import FadeContent from "@/shared/ui/FadeContent";
import { CONTACT_CONTENT } from "../../model/constants";
import type { ElementRef } from "../../types";

interface ContactMapProps {
  embedded: boolean;
  controlled: boolean;
  active?: boolean;
  mapRevealRef: ElementRef;
}

export function ContactMap({
  embedded,
  controlled,
  active,
  mapRevealRef,
}: ContactMapProps) {
  const map = (
    <div className="map-embed">
      <img
        className="contact-map-image"
        src={CONTACT_CONTENT.mapScreenshot}
        width="1730"
        height="1106"
        alt={`Карта: ${CONTACT_CONTENT.address}`}
        loading="lazy"
        decoding="async"
      />
      <div className="map-caption">
        <a
          href={CONTACT_CONTENT.mapPage}
          target="_blank"
          rel="noreferrer"
          aria-label="Открыть карту в Яндекс Картах"
        >
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
          <span>Открыть карту</span>
        </a>
      </div>
    </div>
  );

  return embedded ? (
    <div ref={mapRevealRef} className="contact-map-reveal" data-contact-map>
      {map}
    </div>
  ) : (
    <FadeContent
      className="contact-map-reveal"
      blur
      duration={900}
      delay={100}
      ease="power3.out"
      threshold={0.18}
      initialOpacity={0}
      active={controlled ? active : undefined}
    >
      {map}
    </FadeContent>
  );
}
