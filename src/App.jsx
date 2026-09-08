import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MessageCircle, Phone, PhoneCall } from "lucide-react";
import { BrandsCarousel } from "./components/BrandsCarousel";
import { ContactDialog, ContactTrigger } from "./components/ContactDialog";
import { DriveAwayReviews } from "./components/DriveAwayReviews";
import { HeroSequence } from "./components/HeroSequence";
import { PriceListSection } from "./components/PriceListSection";
import { PromotionsSection } from "./components/PromotionsSection";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function DesktopContactDock() {
  const dockRef = useRef(null);

  useGSAP(() => {
    const dock = dockRef.current;
    if (!dock) return undefined;

    const media = gsap.matchMedia();

    media.add(
      {
        desktop: "(min-width: 48rem)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        if (!context.conditions.desktop) return undefined;

        const hero = document.querySelector(".hero-scroll-sequence");
        if (!hero) return undefined;

        const reduceMotion = context.conditions.reduceMotion;
        const hiddenTransform = reduceMotion
          ? "translateY(0px)"
          : "translateY(14px)";
        const duration = reduceMotion ? 0.15 : 0.34;
        let dockVisible = false;

        const setDockVisibility = (visible, immediate = false) => {
          if (!immediate && visible === dockVisible) return;
          dockVisible = visible;

          const animation = {
            autoAlpha: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : hiddenTransform,
          };

          if (immediate) {
            gsap.set(dock, animation);
            return;
          }

          gsap.to(dock, {
            ...animation,
            duration,
            ease: "power3.out",
            overwrite: true,
          });
        };

        setDockVisibility(false, true);

        const observer = new IntersectionObserver(([entry]) => {
          const heroHasLeftViewport =
            !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
          setDockVisibility(heroHasLeftViewport);
        });

        observer.observe(hero);

        return () => {
          observer.disconnect();
          gsap.killTweensOf(dock);
        };
      },
    );

    return () => media.revert();
  }, []);

  return (
    <aside ref={dockRef} className="desktop-contact-dock" aria-label="Быстрая связь с автосервисом">
      <div>
        <span>Запись и консультация</span>
        <a href="tel:+79999999999">+7 (999) 999-99-99</a>
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
      <a href="tel:+79999999999" className="mobile-call">
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
      // Hero owns the native input gate; Lenis only filters the same gesture.
      // This avoids competing stop/start owners with the contact dialog.
      virtualScroll: () =>
        document.documentElement.dataset.heroIntroLocked !== "true",
      prevent: (node) =>
        node instanceof Element && Boolean(node.closest("[data-lenis-prevent]")),
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
          <PriceListSection />
          <section className="brands-section" aria-label="Марки автомобилей, которые принимаем в работу">
            <BrandsCarousel />
          </section>
          <PromotionsSection />
          <DriveAwayReviews />
        </main>

        <footer className="site-footer">
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
