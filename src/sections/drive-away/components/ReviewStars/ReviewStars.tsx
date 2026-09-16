import { Star } from "lucide-react";

export function ReviewStars() {
  return (
    <span className="drive-review-stars" aria-label="Оценка: 5 из 5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          size={17}
          strokeWidth={1.75}
          fill="currentColor"
        />
      ))}
    </span>
  );
}
