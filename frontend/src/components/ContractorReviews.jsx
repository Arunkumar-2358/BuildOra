import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { Button } from "./Button";
import { RatingSummary } from "./RatingSummary";
import { ReviewCard } from "./ReviewCard";

const SORTS = [
  ["newest", "Most recent"],
  ["helpful", "Most helpful"],
  ["lowest", "Lowest rated"]
];

// Self-contained review feed for a contractor: aggregate summary, sort/filter
// controls, paginated list. `refreshKey` lets a parent force a reload.
export const ContractorReviews = ({ contractorId, currentUser, refreshKey = 0 }) => {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [sort, setSort] = useState("newest");
  const [rating, setRating] = useState(null);
  const [page, setPage] = useState(1);

  const loadSummary = useCallback(async () => {
    const { data } = await api.get(`/reviews/contractor/${contractorId}/summary`);
    setSummary(data);
  }, [contractorId]);

  const loadReviews = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), sort });
    if (rating) params.set("rating", String(rating));
    const { data } = await api.get(`/reviews/contractor/${contractorId}?${params.toString()}`);
    // Append when paging in, replace on a fresh first page (sort/filter change).
    setReviews((current) => (page > 1 ? [...current, ...data.reviews] : data.reviews));
    setPagination(data.pagination);
  }, [contractorId, page, sort, rating]);

  useEffect(() => {
    if (contractorId) loadSummary();
  }, [contractorId, loadSummary, refreshKey]);

  useEffect(() => {
    if (contractorId) loadReviews();
  }, [contractorId, loadReviews, refreshKey]);

  const onUpdated = (updated) => {
    setReviews((current) => current.map((review) => (review._id === updated._id ? updated : review)));
  };

  const onFilterRating = (value) => {
    setRating(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <RatingSummary summary={summary} activeRating={rating} onFilterRating={onFilterRating} />

      {summary?.totalReviews > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {SORTS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setSort(value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  sort === value ? "bg-brand-gradient text-white" : "border border-line-strong text-muted hover:border-line-strong"
                }`}
              >
                {label}
              </button>
            ))}
            {rating && (
              <button onClick={() => onFilterRating(null)} className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-bold text-accent">
                {rating}★ only · clear
              </button>
            )}
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} currentUser={currentUser} onUpdated={onUpdated} />
            ))}
            {!reviews.length && <p className="text-sm text-muted">No reviews match this filter.</p>}
          </div>

          {pagination.page < pagination.pages && (
            <Button variant="secondary" className="w-full" onClick={() => setPage((p) => p + 1)}>
              Load more reviews
            </Button>
          )}
        </>
      )}
    </div>
  );
};
