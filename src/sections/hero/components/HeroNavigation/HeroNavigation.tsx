import type { RefObject } from "react";
import AnimatedContent from "@/shared/ui/AnimatedContent";
import { ContactTrigger } from "@/features/contact-request";

type HeroNavigationProps = {
  navRef: RefObject<HTMLElement | null>;
  copyVisible: boolean;
  copyRevealDurationSeconds: number;
};

export function HeroNavigation({
  navRef,
  copyVisible,
  copyRevealDurationSeconds,
}: HeroNavigationProps) {
  return (
    <nav
      ref={navRef}
      className="hero-nav flex items-center justify-between"
      aria-label="Главная навигация"
    >
      <AnimatedContent
        active={copyVisible}
        as="a"
        className="wordmark hero-wordmark-reveal"
        distance={16}
        duration={copyRevealDurationSeconds}
        delay={0}
        href="#top"
        aria-label="Автосервис — в начало страницы"
      >
        АВТОСЕРВИС<span aria-hidden="true">/01</span>
      </AnimatedContent>
      <ContactTrigger className="nav-contact" id="hero-contact-trigger">
        Связаться
      </ContactTrigger>
    </nav>
  );
}
