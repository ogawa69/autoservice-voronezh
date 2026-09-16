import { BrandsCarousel } from "./components/BrandsCarousel";
import type { BrandsSectionProps } from "./types";
import "swiper/css";
import "swiper/css/free-mode";
import "./styles.css";

const DEFAULT_ARIA_LABEL = "Марки автомобилей, которые принимаем в работу";

export function BrandsSection({ ariaLabel = DEFAULT_ARIA_LABEL }: BrandsSectionProps) {
  return (
    <section className="brands-section" aria-label={ariaLabel}>
      <BrandsCarousel />
    </section>
  );
}
