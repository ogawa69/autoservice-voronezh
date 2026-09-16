import type { PriceCardContentProps } from "./types";

export function PriceCardContent({ service }: PriceCardContentProps) {
  return (
    <>
      <div className="price-card__copy">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>

      <div className="price-card__price">
        <strong>{service.price}</strong>
        <small>{service.note}</small>
      </div>
    </>
  );
}
