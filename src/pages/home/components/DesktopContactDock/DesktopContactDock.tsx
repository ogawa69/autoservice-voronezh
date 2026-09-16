import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { PhoneCall } from "lucide-react";
import { ContactTrigger } from "@/features/contact-request";
import { siteProfile } from "@/content/demo";

export function DesktopContactDock() {
  const dockRef = useRef<HTMLElement>(null);

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
        if (!context.conditions?.desktop) return undefined;

        const hero = document.querySelector(".hero-scroll-sequence");
        if (!hero) return undefined;

        const reduceMotion = context.conditions.reduceMotion;
        const hiddenTransform = reduceMotion
          ? "translateY(0px)"
          : "translateY(14px)";
        const duration = reduceMotion ? 0.15 : 0.34;
        let dockVisible = false;

        const setDockVisibility = (visible: boolean, immediate = false) => {
          if (!immediate && visible === dockVisible) return;
          dockVisible = visible;
          const animation = {
            autoAlpha: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : hiddenTransform,
          };

          if (immediate) {
            gsap.set(dock, animation);
          } else {
            gsap.to(dock, {
              ...animation,
              duration,
              ease: "power3.out",
              overwrite: true,
            });
          }
        };

        setDockVisibility(false, true);
        const observer = new IntersectionObserver(([entry]) => {
          if (!entry) return;
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
    <aside
      ref={dockRef}
      className="desktop-contact-dock"
      aria-label="Быстрая связь с автосервисом"
    >
      <div>
        <span>Запись и консультация</span>
        <a href={siteProfile.phoneHref}>{siteProfile.phoneLabel}</a>
      </div>
      <ContactTrigger
        className="desktop-contact-button"
        id="desktop-contact-trigger"
      >
        <PhoneCall aria-hidden="true" size={18} strokeWidth={2} />
        Связаться
      </ContactTrigger>
    </aside>
  );
}
