import { ReviewStars } from "../ReviewStars/ReviewStars";
import type { Review } from "../../types";

interface ReviewCardProps {
  review: Review;
}
export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="drive-review-card">
      <header className="drive-review-card__header">
        <span className="drive-review-card__avatar" aria-hidden="true">
          {review.author.slice(0, 1)}
        </span>
        <strong>{review.author}</strong>
        <ReviewStars />
      </header>
      <p className="drive-review-card__text">{review.text}</p>
    </article>
  );
}
