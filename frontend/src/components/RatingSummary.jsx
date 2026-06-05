import { ThumbsUp } from "lucide-react";
import { SUB_RATINGS, TAG_LABELS } from "../utils/reviews";
import { StarDisplay } from "./StarRating";

const tagLabel = (tag) => TAG_LABELS[tag] || tag;

const STAR_TIERS = [
  ["five", 5],
  ["four", 4],
  ["three", 3],
  ["two", 2],
  ["one", 1]
];

export const RatingSummary = ({ summary, activeRating, onFilterRating }) => {
  if (!summary || !summary.totalReviews) {
    return (
      <div className="premium-card rounded-2xl p-6 text-center shadow-sm">
        <p className="text-lg font-extrabold text-content">No reviews yet</p>
        <p className="mt-2 text-sm text-muted">
          Reviews appear here once a completed project is rated by the client. They are verified to real Buildora projects.
        </p>
      </div>
    );
  }

  const { averageRating, totalReviews, breakdown, avgSubRatings, topTags, wouldHireAgainPercent } = summary;

  return (
    <div className="premium-card rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-5xl font-extrabold text-content">{averageRating.toFixed(1)}</p>
          <div className="mt-1">
            <StarDisplay value={averageRating} size="sm" />
          </div>
          <p className="mt-1 text-sm text-muted">
            {totalReviews === 1 ? "Based on 1 review" : `Based on ${totalReviews} reviews`}
          </p>
        </div>
        {wouldHireAgainPercent !== null && (
          <div className="ml-auto rounded-xl bg-success/10 px-4 py-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-2xl font-extrabold text-success">
              <ThumbsUp className="h-5 w-5" />
              {wouldHireAgainPercent}%
            </p>
            <p className="text-xs font-semibold text-success">would hire again</p>
          </div>
        )}
      </div>

      {/* Star breakdown — clicking a bar filters the list */}
      <div className="mt-5 space-y-1.5">
        {STAR_TIERS.map(([key, star]) => {
          const count = breakdown[key] || 0;
          const percent = totalReviews ? (count / totalReviews) * 100 : 0;
          const isActive = activeRating === star;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilterRating?.(isActive ? null : star)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-surface-2/60 ${
                isActive ? "bg-surface-2/80" : ""
              }`}
            >
              <span className="w-10 text-sm font-semibold text-muted">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-spark" style={{ width: `${percent}%` }} />
              </span>
              <span className="w-8 text-right text-sm text-muted">{count}</span>
            </button>
          );
        })}
      </div>

      {avgSubRatings && (
        <div className="mt-6 grid gap-3 border-t border-line/40 pt-5 sm:grid-cols-2">
          {SUB_RATINGS.map(({ key, label }) =>
            avgSubRatings[key] ? (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted">{label}</span>
                <span className="flex items-center gap-2 text-sm font-bold text-content">
                  <StarDisplay value={avgSubRatings[key]} size="sm" />
                  {avgSubRatings[key].toFixed(1)}
                </span>
              </div>
            ) : null
          )}
        </div>
      )}

      {topTags?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line/40 pt-5">
          {topTags.map(({ tag, count }) => (
            <span key={tag} className="rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
              {tagLabel(tag)} · {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
