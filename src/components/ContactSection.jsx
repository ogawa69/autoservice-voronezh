import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Clock3, MapPin, Phone } from "lucide-react";
import { useReducedMotion } from "motion/react";
import FadeContent from "./FadeContent";
import { RevealHeading } from "./RevealHeading";
import VerticalCutReveal from "./fancy/text/vertical-cut-reveal";
import Typewriter from "./fancy/text/typewriter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const phoneDisplay = "+7 (999) 999-99-99";
const phoneHref = "tel:+79999999999";
const address = "Воронеж, проспект Революции, 9";
const workingHours = "10:00–21:00";
const mapScreenshot = "/maps/contact-map-voronezh.png";
const yandexMapPage =
  "https://yandex.ru/maps/193/voronezh/house/prospekt_revolyutsii_9/Z0AYdAZkSUYGQFtrfXp2dnRjZA==/?ll=39.214031%2C51.677800&z=17";

function TypedContactValue({ text, visible, cycle, delay = 0, animate = true }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {visible && animate ? (
        <Typewriter
          key={`${cycle}-${text}`}
          as="span"
          text={text}
          speed={22}
          initialDelay={delay}
          loop={false}
          showCursor={false}
          aria-hidden="true"
        />
      ) : visible ? (
        <span aria-hidden="true">{text}</span>
      ) : (
        <span className="contact-type-placeholder" aria-hidden="true">
          {text}
        </span>
      )}
    </>
  );
}

export function ContactSection({ embedded = false, active, headingRevealRef }) {
  const sectionRef = useRef(null);
  const mapRevealRef = useRef(null);
  const reduceMotion = Boolean(useReducedMotion());
  const controlled = typeof active === "boolean";
  const [copyVisible, setCopyVisible] = useState(false);
  const [copyCycle, setCopyCycle] = useState(0);
  const showContactCopy = reduceMotion || copyVisible;

  useEffect(() => {
    if (!controlled) return;

    if (reduceMotion) {
      setCopyVisible(true);
      return;
    }

    if (active) {
      setCopyCycle((cycle) => cycle + 1);
      setCopyVisible(true);
    } else {
      setCopyVisible(false);
    }
  }, [active, controlled, reduceMotion]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const mapReveal = mapRevealRef.current;
    const details = section?.querySelector(".contact-details");
    const frame = section?.closest(".drive-away-contact");
    if (!embedded || !section || !details || !mapReveal || !frame) {
      return undefined;
    }

    const mobile = window.matchMedia("(max-width: 47.999rem)");
    let resizeFrame = 0;

    const syncMapHeight = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        if (!mobile.matches || reduceMotion) {
          mapReveal.style.removeProperty("--contact-map-top-offset");
          mapReveal.style.removeProperty("--contact-map-fill-height");
          return;
        }

        const frameRect = frame.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        const currentGap =
          mapReveal.offsetTop - (details.offsetTop + details.offsetHeight);
        const mapTopOffset = 32 - currentGap;
        const mapTop =
          sectionRect.top - frameRect.top + mapReveal.offsetTop + mapTopOffset;
        const availableHeight = Math.max(0, frame.clientHeight - mapTop);

        mapReveal.style.setProperty(
          "--contact-map-top-offset",
          `${Math.ceil(mapTopOffset)}px`,
        );
        mapReveal.style.setProperty(
          "--contact-map-fill-height",
          `${Math.ceil(availableHeight)}px`,
        );
      });
    };

    const resizeObserver = new ResizeObserver(syncMapHeight);
    resizeObserver.observe(frame);
    resizeObserver.observe(section);
    resizeObserver.observe(details);
    resizeObserver.observe(mapReveal);
    mobile.addEventListener("change", syncMapHeight);
    window.addEventListener("resize", syncMapHeight);
    window.visualViewport?.addEventListener("resize", syncMapHeight);
    syncMapHeight();

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      mobile.removeEventListener("change", syncMapHeight);
      window.removeEventListener("resize", syncMapHeight);
      window.visualViewport?.removeEventListener("resize", syncMapHeight);
      mapReveal.style.removeProperty("--contact-map-top-offset");
      mapReveal.style.removeProperty("--contact-map-fill-height");
    };
  }, [embedded, reduceMotion]);

  const map = (
    <div className="map-embed">
      <img
        className="contact-map-image"
        src={mapScreenshot}
        width="1730"
        height="1106"
        alt="Карта: Воронеж, проспект Революции, 9"
        loading="lazy"
        decoding="async"
      />
      <div className="map-caption">
        <a
          href={yandexMapPage}
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

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || controlled) return undefined;

      if (reduceMotion) {
        setCopyVisible(true);
        return undefined;
      }

      setCopyVisible(false);
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 72%",
        once: true,
        onEnter: () => {
          setCopyCycle((cycle) => cycle + 1);
          setCopyVisible(true);
        },
      });

      return () => trigger.kill();
    },
    {
      scope: sectionRef,
      dependencies: [controlled, reduceMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="contacts"
      className={`contacts-section contact-story${embedded ? " contact-story--embedded" : ""}`}
      aria-labelledby="contacts-title"
    >
      <div className="contact-details">
        <div className="contact-story__heading">
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
                  transition={{
                    type: "spring",
                    duration: 0.5,
                    bounce: 0.2,
                  }}
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
          <div className="contact-details__phone" data-contact-item="phone">
            <dt>
              <Phone aria-hidden="true" size={20} strokeWidth={2} /> Телефон
            </dt>
            <dd>
              <a href={phoneHref}>
                <TypedContactValue
                  text={phoneDisplay}
                  visible={showContactCopy}
                  cycle={copyCycle}
                  delay={80}
                  animate={!reduceMotion}
                />
              </a>
            </dd>
          </div>
          <div className="contact-details__hours" data-contact-item="hours">
            <dt>
              <Clock3 aria-hidden="true" size={20} strokeWidth={2} /> Время работы
            </dt>
            <dd>
              <TypedContactValue
                text={workingHours}
                visible={showContactCopy}
                cycle={copyCycle}
                delay={360}
                animate={!reduceMotion}
              />
            </dd>
          </div>
          <div
            className="contact-details__address"
            data-contact-item="address"
          >
            <dt>
              <MapPin aria-hidden="true" size={20} strokeWidth={2} /> Адрес
            </dt>
            <dd>
              <a href={yandexMapPage} target="_blank" rel="noreferrer">
                <TypedContactValue
                  text={address}
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

      {embedded ? (
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
      )}
    </section>
  );
}
