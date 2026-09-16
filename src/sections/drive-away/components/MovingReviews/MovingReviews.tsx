import SimpleMarquee from "@/shared/ui/SimpleMarquee";
import { ReviewSet } from "../ReviewSet/ReviewSet";
import type { ElementRef, Review } from "../../types";

interface MovingReviewsProps {
  reviews: readonly Review[];
  active: boolean;
  firstRowRef: ElementRef;
  secondRowRef: ElementRef;
}

export function MovingReviews({
  reviews,
  active,
  firstRowRef,
  secondRowRef,
}: MovingReviewsProps) {
  const splitIndex = Math.ceil(reviews.length / 2);
  const rows = [reviews.slice(0, splitIndex), reviews.slice(splitIndex)];

  return (
    <div className="drive-review-rows">
      <div ref={firstRowRef} className="drive-review-row">
        <SimpleMarquee
          direction="left"
          baseVelocity={2.4}
          repeat={4}
          useScrollVelocity
          active={active}
          slowdownOnHover
          slowDownFactor={0}
        >
          <ReviewSet reviews={rows[0]} />
        </SimpleMarquee>
      </div>
      <div
        ref={secondRowRef}
        className="drive-review-row drive-review-row--reverse"
      >
        <SimpleMarquee
          direction="right"
          baseVelocity={2.1}
          repeat={4}
          useScrollVelocity
          active={active}
          slowdownOnHover
          slowDownFactor={0}
        >
          <ReviewSet reviews={rows[1]} />
        </SimpleMarquee>
      </div>
    </div>
  );
}
