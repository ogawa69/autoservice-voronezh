import { ReviewCard } from "../ReviewCard/ReviewCard";
import type { Review } from "../../types";

interface StaticReviewsProps {
  reviews: readonly Review[];
}
export function StaticReviews({ reviews }: StaticReviewsProps) {
  return (
    <div className="drive-review-static-grid">
      {reviews.map((review) => (
        <ReviewCard key={`${review.author}-${review.car}`} review={review} />
      ))}
    </div>
  );
}
