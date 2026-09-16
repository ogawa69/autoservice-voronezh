import { Pause, Play } from "lucide-react";
import VerticalCutReveal from "@/shared/ui/VerticalCutReveal";
import { MovingReviews } from "../MovingReviews/MovingReviews";
import { StaticReviews } from "../StaticReviews/StaticReviews";
import type {
  ElementRef,
  RevealControllerRef,
  Review,
} from "../../types";

interface ReviewsSceneProps {
  reviews: readonly Review[];
  reduceMotion: boolean;
  motionActive: boolean;
  marqueePaused: boolean;
  onToggleMarquee: () => void;
  sceneRef: ElementRef;
  headerRef: ElementRef<HTMLElement>;
  headingCopyRef: ElementRef;
  titleRef: RevealControllerRef;
  firstRowRef: ElementRef;
  secondRowRef: ElementRef;
  motionToggleRef: ElementRef<HTMLButtonElement>;
}

export function ReviewsScene({
  reviews,
  reduceMotion,
  motionActive,
  marqueePaused,
  onToggleMarquee,
  sceneRef,
  headerRef,
  headingCopyRef,
  titleRef,
  firstRowRef,
  secondRowRef,
  motionToggleRef,
}: ReviewsSceneProps) {
  return (
    <div ref={sceneRef} className="drive-away-reviews">
      <header ref={headerRef} className="drive-away-reviews__header">
        <div ref={headingCopyRef} className="drive-away-reviews__heading-copy">
          <h2 id="drive-away-reviews-title">
            {reduceMotion ? (
              "Отзывы наших клиентов. Работаем по делу."
            ) : (
              <VerticalCutReveal
                ref={titleRef}
                autoStart={false}
                splitBy="words"
                staggerDuration={0.075}
                staggerFrom="first"
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                containerClassName="drive-away-reviews__title-reveal"
              >
                Отзывы наших клиентов. Работаем по делу.
              </VerticalCutReveal>
            )}
          </h2>
        </div>
        {!reduceMotion && (
          <button
            ref={motionToggleRef}
            className="drive-away-reviews__motion-toggle"
            type="button"
            aria-label={
              marqueePaused
                ? "Продолжить движение отзывов"
                : "Остановить движение отзывов"
            }
            aria-pressed={marqueePaused}
            onClick={onToggleMarquee}
          >
            {marqueePaused ? (
              <Play aria-hidden="true" size={17} fill="currentColor" />
            ) : (
              <Pause aria-hidden="true" size={17} fill="currentColor" />
            )}
          </button>
        )}
      </header>
      {reduceMotion ? (
        <StaticReviews reviews={reviews} />
      ) : (
        <MovingReviews
          reviews={reviews}
          active={motionActive && !marqueePaused}
          firstRowRef={firstRowRef}
          secondRowRef={secondRowRef}
        />
      )}
    </div>
  );
}
