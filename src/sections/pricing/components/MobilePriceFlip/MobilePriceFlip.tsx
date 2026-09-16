import { useMobilePriceFlip } from "../../hooks/useMobilePriceFlip";
import { PRICE_CARD_HALF_TURN_DEGREES } from "../../lib/priceCardMotion";
import type { PriceSectionStyle } from "../../model/types";
import { PriceCardContent } from "../PriceCardContent/PriceCardContent";
import { PriceSectionAction } from "../PriceSectionAction/PriceSectionAction";
import { PriceSectionHeader } from "../PriceSectionHeader/PriceSectionHeader";
import type { MobilePriceFlipProps } from "./types";

export function MobilePriceFlip({ services }: MobilePriceFlipProps) {
  const {
    sectionRef,
    cardRef,
    rotorRef,
    surfaceRef,
    activeIndex,
    activeService,
    serviceCount,
    handleKeyboard,
  } = useMobilePriceFlip(services);

  if (!activeService) return null;

  const sectionStyle: PriceSectionStyle = {
    "--price-list-slides": serviceCount,
  };

  return (
    <section
      ref={sectionRef}
      id="prices"
      className="price-list price-list--mobile-flip"
      aria-labelledby="price-list-title"
      style={sectionStyle}
    >
      <div className="price-list__sticky">
        <PriceSectionHeader />

        <div
          className="price-list__scene"
          role="region"
          aria-roledescription="карусель"
          aria-label="Цены на услуги автосервиса"
          tabIndex={0}
          onKeyDown={handleKeyboard}
        >
          <article
            ref={cardRef}
            className="price-card"
            data-price-card
            aria-label={`Услуга ${activeIndex + 1} из ${serviceCount}: ${activeService.title}, ${activeService.price}`}
          >
            <div ref={rotorRef} className="price-card__rotor" data-price-rotor>
              <div
                ref={surfaceRef}
                className="price-card__surface"
                data-price-surface
                style={{
                  transform: `rotateX(${activeIndex * PRICE_CARD_HALF_TURN_DEGREES}deg)`,
                }}
              >
                <PriceCardContent service={activeService} />
              </div>
            </div>
          </article>
        </div>

        <PriceSectionAction />
      </div>
    </section>
  );
}
