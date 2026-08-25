import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, Clock3, MapPin, MessageCircle, Phone, PhoneCall } from "lucide-react";
import { BrandsCarousel } from "./components/BrandsCarousel";
import { ContactDialog, ContactTrigger } from "./components/ContactDialog";
import { Gallery } from "./components/Gallery";
import { HeroSequence } from "./components/HeroSequence";
import { RevealHeading } from "./components/RevealHeading";
import { ReviewsCarousel } from "./components/ReviewsCarousel";
import { TechnicalScan } from "./components/TechnicalScan";
import { services } from "./data/siteContent";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const yandexMapEmbed =
  "https://yandex.ru/map-widget/v1/?mode=search&text=%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B5%D0%B6%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A0%D0%B5%D0%B2%D0%BE%D0%BB%D1%8E%D1%86%D0%B8%D0%B8%2C%209&z=16";
const yandexMapPage =
  "https://yandex.ru/maps/193/voronezh/?text=%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B5%D0%B6%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A0%D0%B5%D0%B2%D0%BE%D0%BB%D1%8E%D1%86%D0%B8%D0%B8%2C%209";

function ServicesSection() {
  const sectionRef = useRef(null);
  const activeServiceRef = useRef(0);
  const [activeService, setActiveService] = useState(0);
  const reduceMotion = useReducedMotion();

  const selectService = (index) => {
    activeServiceRef.current = index;
    setActiveService(index);
  };

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          desktop: "(min-width: 60rem)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions.desktop || !context.conditions.motion) return;

          const stage = sectionRef.current?.querySelector(".services-stage");
          if (!stage) return undefined;

          const trigger = ScrollTrigger.create({
            trigger: stage,
            start: "top top+=16",
            end: () => `+=${Math.max(window.innerHeight * 2.25, 2200)}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              const nextIndex = Math.min(services.length - 1, Math.floor(progress * services.length));

              if (nextIndex !== activeServiceRef.current) {
                activeServiceRef.current = nextIndex;
                setActiveService(nextIndex);
              }
            },
          });

          return () => trigger.kill();
        },
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="services" className="services-section" aria-labelledby="services-title">
      <div className="section-heading services-heading">
        <RevealHeading id="services-title">Работы без лишних обещаний</RevealHeading>
        <p>
          Выберите направление — покажем, что проверяем и с чем работаем. Состав ремонта согласуем после диагностики.
        </p>
      </div>

      <div className="services-stage">
        <div className="service-accordion">
          {services.map((service, index) => {
            const isActive = activeService === index;
            const panelId = `service-panel-${index + 1}`;
            const triggerId = `service-trigger-${index + 1}`;

            return (
              <motion.article
                className="service-card"
                data-active={isActive}
                key={service.title}
                layout={!reduceMotion}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { layout: { duration: 0.42, ease: [0.77, 0, 0.175, 1] } }
                }
              >
                <h3>
                  <button
                    id={triggerId}
                    className="service-card-trigger"
                    type="button"
                    aria-expanded={isActive}
                    aria-controls={panelId}
                    onClick={() => selectService(index)}
                  >
                    <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="service-card-title">{service.title}</span>
                    <span className="service-card-summary">{service.summary}</span>
                    <ChevronDown aria-hidden="true" size={22} strokeWidth={1.75} />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      id={panelId}
                      className="service-card-panel"
                      role="region"
                      aria-labelledby={triggerId}
                      initial={reduceMotion ? false : { opacity: 0, transform: "translateY(12px)" }}
                      animate={{ opacity: 1, transform: "translateY(0px)" }}
                      exit={{ opacity: 0, transform: reduceMotion ? "translateY(0px)" : "translateY(8px)" }}
                      transition={{
                        duration: reduceMotion ? 0.15 : 0.3,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                    >
                      <div className="service-card-copy">
                        <p>{service.description}</p>
                        <span>
                          {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                        </span>
                      </div>

                      <figure className="service-card-visual">
                        <img
                          src={service.image}
                          alt={service.imageAlt}
                          width={service.imageWidth}
                          height={service.imageHeight}
                          loading="lazy"
                        />
                        <figcaption>{service.imageCaption}</figcaption>
                      </figure>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>

      <div className="service-catalog-entry">
        <div>
          <h3>Нужна другая работа?</h3>
          <p>Опишите автомобиль и задачу — подскажем, сможем ли помочь.</p>
        </div>
        <ContactTrigger className="service-catalog-contact" id="service-catalog-contact-trigger">
          Уточнить услугу
          <ArrowUpRight aria-hidden="true" size={20} strokeWidth={2} />
        </ContactTrigger>
      </div>

      <BrandsCarousel />
    </section>
  );
}

function DesktopContactDock() {
  const dockRef = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add(
      {
        desktop: "(min-width: 48rem)",
        motion: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        if (!context.conditions.desktop || !context.conditions.motion) return undefined;

        const tween = gsap.fromTo(
          dockRef.current,
          { autoAlpha: 0, transform: "translateY(14px)" },
          {
            autoAlpha: 1,
            transform: "translateY(0px)",
            duration: 0.34,
            ease: "power3.out",
            paused: true,
          },
        );
        const trigger = ScrollTrigger.create({
          trigger: "#services",
          start: "top 78%",
          onEnter: () => tween.play(),
          onLeaveBack: () => tween.reverse(),
        });

        return () => {
          trigger.kill();
          tween.kill();
        };
      },
    );

    return () => media.revert();
  }, []);

  return (
    <aside ref={dockRef} className="desktop-contact-dock" aria-label="Быстрая связь с автосервисом">
      <div>
        <span>Запись и консультация</span>
        <a href="tel:99999999">99999999</a>
      </div>
      <ContactTrigger className="desktop-contact-button" id="desktop-contact-trigger">
        <PhoneCall aria-hidden="true" size={18} strokeWidth={2} />
        Связаться
      </ContactTrigger>
    </aside>
  );
}

function MobileContactBar() {
  return (
    <aside className="mobile-contact-bar" aria-label="Быстрые действия">
      <a href="tel:99999999" className="mobile-call">
        <Phone aria-hidden="true" size={20} strokeWidth={2} />
        Позвонить
      </a>
      <ContactTrigger className="mobile-write" id="mobile-contact-trigger">
        <MessageCircle aria-hidden="true" size={20} strokeWidth={2} />
        Написать
      </ContactTrigger>
    </aside>
  );
}

function App() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 40rem)").matches;

    if (reduceMotion || !isDesktop) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      anchors: true,
      smoothWheel: true,
      prevent: (node) => node instanceof Element && Boolean(node.closest("[data-lenis-prevent]")),
    });
    const updateScroll = () => ScrollTrigger.update();
    const tick = (time) => lenis.raf(time * 1000);

    lenisRef.current = lenis;
    lenis.on("scroll", updateScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", updateScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <ContactDialog scrollControllerRef={lenisRef}>
      <div id="top" className="site-shell">
        <main>
          <HeroSequence />

          <section className="contact-premise" aria-labelledby="premise-title">
            <p>Расскажите, что происходит с автомобилем — подскажем, с чего начать.</p>
            <div>
              <RevealHeading id="premise-title">Сначала разберёмся, затем назовём следующий шаг.</RevealHeading>
              <ContactTrigger className="primary-contact" id="premise-contact-trigger">
                Открыть связь
                <ArrowUpRight aria-hidden="true" size={20} strokeWidth={2} />
              </ContactTrigger>
            </div>
          </section>

          <ServicesSection />
          <TechnicalScan />
          <Gallery />
          <ReviewsCarousel />

          <section id="contacts" className="contacts-section" aria-labelledby="contacts-title">
            <div className="contact-details">
              <RevealHeading id="contacts-title">Приезжайте или напишите</RevealHeading>
              <dl>
                <div>
                  <dt>
                    <Phone aria-hidden="true" size={20} strokeWidth={2} /> Телефон
                  </dt>
                  <dd>
                    <a href="tel:99999999">99999999</a>
                  </dd>
                </div>
                <div>
                  <dt>
                    <MapPin aria-hidden="true" size={20} strokeWidth={2} /> Адрес
                  </dt>
                  <dd>
                    <a href={yandexMapPage} target="_blank" rel="noreferrer">
                      Воронеж, проспект Революции, 9
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>
                    <Clock3 aria-hidden="true" size={20} strokeWidth={2} /> Часы работы
                  </dt>
                  <dd>По предварительной записи</dd>
                </div>
              </dl>
              <ContactTrigger className="primary-contact contact-section-trigger" id="contacts-dialog-trigger">
                Выбрать способ связи
                <ArrowUpRight aria-hidden="true" size={20} strokeWidth={2} />
              </ContactTrigger>
            </div>

            <div className="map-embed">
              <iframe
                src={yandexMapEmbed}
                title="Яндекс Карта: Воронеж, проспект Революции, 9"
                loading="lazy"
                allowFullScreen
              />
              <div className="map-caption">
                <span>Воронеж · проспект Революции, 9</span>
                <a href={yandexMapPage} target="_blank" rel="noreferrer">
                  Открыть карту
                  <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <p>Точный сервис начинается с понятного разговора.</p>
          <div>
            <span>АВТОСЕРВИС/01</span>
            <span>Воронеж · проспект Революции, 9</span>
          </div>
        </footer>

        <DesktopContactDock />
        <MobileContactBar />
      </div>
    </ContactDialog>
  );
}

export default App;
