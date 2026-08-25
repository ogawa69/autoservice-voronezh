import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export function RevealHeading({ as: Tag = "h2", children, className, ...props }) {
  const headingRef = useRef(null);

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

          const split = SplitText.create(headingRef.current, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              return gsap.fromTo(
                self.lines,
                { transform: "translateY(105%)" },
                {
                  transform: "translateY(0%)",
                  duration: 0.65,
                  stagger: 0.07,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: headingRef.current,
                    start: "top 82%",
                    once: true,
                  },
                },
              );
            },
          });

          return () => split.revert();
        },
      );

      return () => media.revert();
    },
    { scope: headingRef },
  );

  return (
    <Tag ref={headingRef} className={className} {...props}>
      {children}
    </Tag>
  );
}
