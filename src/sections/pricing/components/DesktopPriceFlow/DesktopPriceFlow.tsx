import { useDesktopPriceCards } from "../../hooks/useDesktopPriceCards";
import type { PriceSectionStyle } from "../../model/types";
import { PriceCardContent } from "../PriceCardContent/PriceCardContent";
import { PriceSectionAction } from "../PriceSectionAction/PriceSectionAction";
import { PriceSectionHeader } from "../PriceSectionHeader/PriceSectionHeader";
import type { DesktopPriceFlowProps } from "./types";

export function DesktopPriceFlow({ services }: DesktopPriceFlowProps) {
  const {
    sectionRef,
    activeIndex,
    serviceCount,
    setCardRef,
    handleKeyboard,
  } = useDesktopPriceCards(services);

  if (serviceCount === 0) return null;

  const sectionStyle: PriceSectionStyle = {
    "--price-list-slides": serviceCount,
  };

  return (
    <section
      ref={sectionRef}
      id="prices"
      className="price-list price-list--desktop-flow"
      aria-labelledby="price-list-title"
      style={sectionStyle}
    >
      <div className="price-list__sticky">
        <PriceSectionHeader />

        <div
          className="price-list__scene price-list__scene--flow"
          role="region"
          aria-roledescription="карусель"
          aria-label="Цены на услуги автосервиса"
          tabIndex={0}
          onKeyDown={handleKeyboard}
        >
          {services.map((service, index) => (
            <article
              key={service.title}
              ref={(node) => setCardRef(index, node)}
              className="price-card price-card--flow"
              data-price-flow-card
              data-active={index === activeIndex ? "true" : undefined}
              aria-hidden={index !== activeIndex}
              aria-label={`Услуга ${index + 1} из ${serviceCount}: ${service.title}, ${service.price}`}
            >
              <div className="price-card__surface">
                <PriceCardContent service={service} />
              </div>
            </article>
          ))}
        </div>

        <div
          className="price-list__void price-list__void--left"
          aria-hidden="true"
        />
        <div
          className="price-list__void price-list__void--right"
          aria-hidden="true"
        />
        <PriceSectionAction flow />
      </div>
    </section>
  );
}
