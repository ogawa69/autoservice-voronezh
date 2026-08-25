import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ArrowDownRight } from "lucide-react";
import { ContactTrigger } from "./ContactDialog";

gsap.registerPlugin(SplitText, useGSAP);

const slices = Array.from({ length: 8 }, (_, index) => ({
  start: `${(index / 8) * 100}%`,
  end: `${((index + 1) / 8) * 100}%`,
}));

export function HeroSequence() {
  const heroRef = useRef(null);
  const darkRef = useRef(null);
  const lightRef = useRef(null);
  const sliceGroupRef = useRef(null);
  const headingRef = useRef(null);
  const metaRef = useRef(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(headingRef.current, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            return gsap.fromTo(
              self.words,
              { transform: "translateY(105%)" },
              {
                transform: "translateY(0%)",
                duration: 0.65,
                stagger: 0.055,
                delay: 0.28,
                ease: "power3.out",
              },
            );
          },
        });

        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

        timeline
          .fromTo(
            darkRef.current,
            { transform: "scale(1.025)" },
            { transform: "scale(1)", duration: 1.4 },
            0,
          )
          .fromTo(
            metaRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            0.72,
          )
          .to(
            sliceGroupRef.current.children,
            { opacity: 0.82, duration: 0.38, stagger: 0.12 },
            0.85,
          )
          .to(lightRef.current, { opacity: 0.26, duration: 0.7, ease: "power2.out" }, 0.95)
          .to(lightRef.current, { opacity: 0.58, duration: 0.7, ease: "power2.out" }, 1.55)
          .to(lightRef.current, { opacity: 1, duration: 0.85, ease: "power2.out" }, 2.05)
          .to(sliceGroupRef.current.children, { opacity: 0, duration: 0.4 }, 2.72);

        return () => split.revert();
      });

      return () => media.revert();
    },
    { scope: heroRef },
  );

  return (
    <section ref={heroRef} className="hero relative grid min-w-0" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        <picture>
          <source media="(max-width: 47.999rem)" srcSet="/hero/mobile-dark-portrait.png" />
          <img
            ref={darkRef}
            className="hero-image hero-image-dark"
            src="/hero/dark.png"
            width="1448"
            height="1086"
            fetchPriority="high"
            alt=""
          />
        </picture>
        <picture>
          <source media="(max-width: 47.999rem)" srcSet="/hero/mobile-light-portrait.png" />
          <img
            ref={lightRef}
            className="hero-image hero-image-light"
            src="/hero/light.png"
            width="1448"
            height="1086"
            fetchPriority="high"
            alt=""
          />
        </picture>

        <div ref={sliceGroupRef} className="hero-light-slices">
          {slices.map((slice) => (
            <span
              key={slice.start}
              className="hero-light-slice"
              style={{ "--slice-start": slice.start, "--slice-end": slice.end }}
            />
          ))}
        </div>
        <div className="hero-scrim" />
      </div>

      <nav className="hero-nav flex items-center justify-between" aria-label="Главная навигация">
        <a className="wordmark" href="#top" aria-label="Автосервис — в начало страницы">
          АВТОСЕРВИС<span aria-hidden="true">/01</span>
        </a>
        <ContactTrigger className="nav-contact" id="hero-contact-trigger">
          Связаться
        </ContactTrigger>
      </nav>

      <div className="hero-copy min-w-0">
        <h1 ref={headingRef} id="hero-title">
          Видим то,
          <br />
          что скрыто.
        </h1>
        <div ref={metaRef} className="hero-meta flex items-end justify-between">
          <p>Диагностика, обслуживание и ремонт · Воронеж, проспект Революции, 9.</p>
          <a href="#services" className="hero-scroll">
            Смотреть дальше
            <ArrowDownRight aria-hidden="true" size={20} strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
}
