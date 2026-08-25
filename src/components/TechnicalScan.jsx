import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function TechnicalScan() {
  const sectionRef = useRef(null);
  const scanRef = useRef(null);
  const imageRef = useRef(null);
  const noteGroupRef = useRef(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          desktop: "(min-width: 40rem)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions.desktop || !context.conditions.motion) return undefined;

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 68%",
              once: true,
            },
          });

          timeline
            .fromTo(
              imageRef.current,
              { opacity: 0.7, transform: "scale(1.045)" },
              { opacity: 1, transform: "scale(1)", duration: 0.85, ease: "power3.out" },
            )
            .fromTo(
              scanRef.current,
              { opacity: 0, transform: "translateX(-310px)" },
              { opacity: 1, transform: "translateX(-270px)", duration: 0.2, ease: "power3.out" },
              0.12,
            )
            .to(scanRef.current, {
              transform: "translateX(270px)",
              duration: 1.4,
              ease: "power2.inOut",
            })
            .to(scanRef.current, { opacity: 0, duration: 0.2, ease: "power2.out" })
            .fromTo(
              noteGroupRef.current.children,
              { opacity: 0, transform: "translateY(8px)" },
              {
                opacity: 1,
                transform: "translateY(0px)",
                duration: 0.35,
                stagger: 0.06,
                ease: "power3.out",
              },
              0.75,
            );

          return () => timeline.kill();
        },
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="diagnostic-section" aria-labelledby="diagnostic-title">
      <div className="diagnostic-copy">
        <RevealHeading id="diagnostic-title">Сначала причина. Потом работа.</RevealHeading>
        <p>
          Проверяем автомобиль по шагам, фиксируем найденное и согласовываем ремонт до начала работ.
        </p>
        <ol ref={noteGroupRef} className="diagnostic-steps">
          <li>Первичная проверка</li>
          <li>Диагностика узла</li>
          <li>Согласование ремонта</li>
        </ol>
      </div>

      <figure className="diagnostic-visual">
        <img
          ref={imageRef}
          src="/illustrations/brake-assembly.png"
          alt="Тормозной диск, суппорт и ступица в направленном студийном свете"
          width="1536"
          height="1024"
          loading="lazy"
        />
        <span ref={scanRef} className="diagnostic-scan-line" aria-hidden="true" />
        <figcaption>Проверяем диски, колодки, направляющие и суппорты как единую систему.</figcaption>
      </figure>
    </section>
  );
}
