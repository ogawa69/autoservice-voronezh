import { useRef } from "react";
import { Clock3, MapPin, Phone } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { RevealHeading } from "@/shared/ui/RevealHeading";
import VerticalCutReveal from "@/shared/ui/VerticalCutReveal";
import { useContactCopy } from "../../hooks/useContactCopy";
import { useContactMapLayout } from "../../hooks/useContactMapLayout";
import { CONTACT_CONTENT } from "../../model/constants";
import { ContactMap } from "../ContactMap/ContactMap";
import { TypedContactValue } from "../TypedContactValue/TypedContactValue";
import type { ElementRef, RevealControllerRef } from "../../types";

interface ContactSceneProps {
  embedded?: boolean;
  active?: boolean;
  frameRef?: ElementRef;
  headingRevealRef: RevealControllerRef;
  headingRef: ElementRef;
  phoneRef: ElementRef;
  hoursRef: ElementRef;
  addressRef: ElementRef;
  mapRevealRef: ElementRef;
}

export function ContactScene({
  embedded = false,
  active,
  frameRef,
  headingRevealRef,
  headingRef,
  phoneRef,
  hoursRef,
  addressRef,
  mapRevealRef,
}: ContactSceneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const controlled = typeof active === "boolean";
  const { copyCycle, showContactCopy } = useContactCopy({
    sectionRef,
    controlled,
    active,
    reduceMotion,
  });
  useContactMapLayout({
    embedded,
    reduceMotion,
    sectionRef,
    detailsRef,
    mapRevealRef,
    frameRef,
  });

  return (
    <section
      ref={sectionRef}
      id="contacts"
      className={`contacts-section contact-story${embedded ? " contact-story--embedded" : ""}`}
      aria-labelledby="contacts-title"
    >
      <div ref={detailsRef} className="contact-details">
        <div ref={headingRef} className="contact-story__heading">
          {embedded ? (
            <h2 id="contacts-title">
              {reduceMotion ? (
                "Наши контакты"
              ) : (
                <VerticalCutReveal
                  ref={headingRevealRef}
                  autoStart={false}
                  splitBy="words"
                  staggerDuration={0.075}
                  staggerFrom="first"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  containerClassName="contact-story__title-reveal"
                >
                  Наши контакты
                </VerticalCutReveal>
              )}
            </h2>
          ) : (
            <RevealHeading id="contacts-title">Наши контакты</RevealHeading>
          )}
        </div>
        <dl>
          <div
            ref={phoneRef}
            className="contact-details__phone"
            data-contact-item="phone"
          >
            <dt>
              <Phone aria-hidden="true" size={20} strokeWidth={2} /> Телефон
            </dt>
            <dd>
              <a href={CONTACT_CONTENT.phoneHref}>
                <TypedContactValue
                  text={CONTACT_CONTENT.phoneDisplay}
                  visible={showContactCopy}
                  cycle={copyCycle}
                  delay={80}
                  animate={!reduceMotion}
                />
              </a>
            </dd>
          </div>
          <div
            ref={hoursRef}
            className="contact-details__hours"
            data-contact-item="hours"
          >
            <dt>
              <Clock3 aria-hidden="true" size={20} strokeWidth={2} /> Время работы
            </dt>
            <dd>
              <TypedContactValue
                text={CONTACT_CONTENT.workingHours}
                visible={showContactCopy}
                cycle={copyCycle}
                delay={360}
                animate={!reduceMotion}
              />
            </dd>
          </div>
          <div
            ref={addressRef}
            className="contact-details__address"
            data-contact-item="address"
          >
            <dt>
              <MapPin aria-hidden="true" size={20} strokeWidth={2} /> Адрес
            </dt>
            <dd>
              <a href={CONTACT_CONTENT.mapPage} target="_blank" rel="noreferrer">
                <TypedContactValue
                  text={CONTACT_CONTENT.address}
                  visible={showContactCopy}
                  cycle={copyCycle}
                  delay={640}
                  animate={!reduceMotion}
                />
              </a>
            </dd>
          </div>
        </dl>
      </div>
      <ContactMap
        embedded={embedded}
        controlled={controlled}
        active={active}
        mapRevealRef={mapRevealRef}
      />
    </section>
  );
}
