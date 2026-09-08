import { ArrowUpRight } from "lucide-react";
import { promotions } from "../data/siteContent";
import { ContactTrigger } from "./ContactDialog";
import { Masonry } from "./Masonry";

function PromotionCard({ promotion }) {
  return (
    <article
      className="promotion-card"
      data-tone={promotion.tone}
      data-density={promotion.aspect < 1 ? "compact" : "regular"}
      style={{ "--promotion-image-position": promotion.imagePosition }}
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

export function PromotionsSection() {
  return (
    <section id="promotions" className="promotions-section" aria-labelledby="promotions-title">
      <header className="promotions-section__header">
        <h2 id="promotions-title">Акции для автомобиля</h2>
        <p>
          Выберите подходящее предложение. Срок действия и возможность совместить акции уточним при записи.
        </p>
      </header>

      <Masonry
        items={promotions}
        ease="power3.out"
        duration={0.6}
        stagger={0.05}
        animateFrom="top"
        exitDuration={0.2}
        visibleThreshold={0.5}
        hiddenThreshold={0.06}
        scaleOnHover
        hoverScale={0.985}
        renderItem={(promotion) => <PromotionCard promotion={promotion} />}
      />
    </section>
  );
}
