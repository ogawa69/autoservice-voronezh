import { ReviewCard } from "../ReviewCard/ReviewCard";
import type { Review } from "../../types";

interface ReviewSetProps {
  reviews: readonly Review[];
}
export function ReviewSet({ reviews }: ReviewSetProps) {
  return (
    <div className="drive-review-set">
      {reviews.map((review) => (
        <ReviewCard key={`${review.author}-${review.car}`} review={review} />
      ))}
    </div>
  );
}
