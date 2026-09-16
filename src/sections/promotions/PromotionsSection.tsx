import { promotions } from "../../content/demo";
import { Masonry } from "./components/Masonry";
import { PromotionCard } from "./components/PromotionCard";
import type { PromotionsSectionProps } from "./types";
import "./styles.css";

export function PromotionsSection({ id = "promotions" }: PromotionsSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} className="promotions-section" aria-labelledby={titleId}>
      <header className="promotions-section__header">
        <h2 id={titleId}>Акции для автомобиля</h2>
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
