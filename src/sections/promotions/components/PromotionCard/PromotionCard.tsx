import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { ContactTrigger } from "../../../../features/contact-request";
import type { PromotionCardProps } from "./types";

type PromotionCardStyle = CSSProperties & {
  "--promotion-image-position": string;
};

export function PromotionCard({ promotion }: PromotionCardProps) {
  const cardStyle = {
    "--promotion-image-position": promotion.imagePosition,
  } as PromotionCardStyle;

  return (
    <article
      className="promotion-card"
      data-tone={promotion.tone}
      data-density={promotion.aspect < 1 ? "compact" : "regular"}
      style={cardStyle}
    >
      <img
        className="promotion-card__image"
        src={promotion.image}
        alt=""
        width={promotion.imageWidth}
        height={promotion.imageHeight}
        loading="lazy"
        decoding="async"
        aria-hidden="true"
      />
      <div className="promotion-card__content">
        <span className="promotion-card__category">{promotion.category}</span>
        <strong className="promotion-card__mark">{promotion.mark}</strong>
        <div className="promotion-card__copy">
          <h3>{promotion.title}</h3>
          <p>{promotion.description}</p>
        </div>
        <ContactTrigger
          className="promotion-card__action"
          id={`promotion-${promotion.id}-trigger`}
        >
          Уточнить условия
          <span className="sr-only"> для акции «{promotion.title}»</span>
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
        </ContactTrigger>
      </div>
    </article>
  );
}
