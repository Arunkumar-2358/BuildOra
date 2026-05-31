import { Star } from "lucide-react";
import { useState } from "react";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9"
};

// Read-only display — supports fractional averages (e.g. 4.3 stars).
export const StarDisplay = ({ value = 0, size = "sm", showValue = false, count }) => {
  const stars = sizeMap[size] || sizeMap.sm;
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative inline-flex" aria-label={`${value} out of 5 stars`} role="img">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`${stars} text-subtle`} />
          ))}
        </div>
        <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${(Math.min(value, 5) / 5) * 100}%` }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`${stars} flex-shrink-0 fill-amber-400 text-amber-400`} />
          ))}
        </div>
      </div>
      {showValue && value > 0 && <span className="text-sm font-bold text-content">{value.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-sm text-muted">({count})</span>
      )}
    </div>
  );
};

// Interactive, keyboard-accessible star input (radio group under the hood).
export const StarRating = ({ value = 0, onChange, size = "lg", name = "rating", disabled = false }) => {
  const [hover, setHover] = useState(0);
  const stars = sizeMap[size] || sizeMap.lg;
  const active = hover || value;

  return (
    <fieldset
      className="m-0 flex items-center gap-1 border-0 p-0"
      onMouseLeave={() => setHover(0)}
      disabled={disabled}
    >
      <legend className="sr-only">Star rating</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className="cursor-pointer p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange?.(star)}
            className="sr-only"
          />
          <Star
            className={`${stars} transition-colors ${
              star <= active ? "fill-amber-400 text-amber-400" : "text-subtle hover:text-amber-300"
            } ${value === star ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" : ""}`}
          />
          <span className="sr-only">{star} star{star > 1 ? "s" : ""}</span>
        </label>
      ))}
    </fieldset>
  );
};
