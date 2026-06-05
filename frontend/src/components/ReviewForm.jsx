import { ImagePlus, Send, ThumbsUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../services/api";
import { REVIEW_TAGS, SUB_RATINGS, reviewPlaceholder } from "../utils/reviews";
import { Button } from "./Button";
import { StarRating } from "./StarRating";

const MAX_TEXT = 1000;
const MAX_PHOTOS = 5;

export const ReviewForm = ({ projectId, onSubmitted }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [subRatings, setSubRatings] = useState({});
  const [tags, setTags] = useState([]);
  const [wouldHireAgain, setWouldHireAgain] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  const toggleTag = (value) =>
    setTags((current) => (current.includes(value) ? current.filter((tag) => tag !== value) : [...current, value]));

  const setSub = (key, value) => setSubRatings((current) => ({ ...current, [key]: value }));

  const addPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    setPhotos((current) => [...current, ...files].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index) => setPhotos((current) => current.filter((_, i) => i !== index));

  const submit = async (event) => {
    event.preventDefault();
    if (!overallRating) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("project", projectId);
      formData.append("overallRating", String(overallRating));
      if (Object.keys(subRatings).length) formData.append("subRatings", JSON.stringify(subRatings));
      if (tags.length) formData.append("tags", JSON.stringify(tags));
      if (wouldHireAgain !== null) formData.append("wouldHireAgain", String(wouldHireAgain));
      if (reviewText.trim()) formData.append("reviewText", reviewText.trim());
      photos.forEach((file) => formData.append("photos", file));

      const { data } = await api.post("/reviews", formData);
      onSubmitted?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit review");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="premium-card rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-content">Leave a review</h2>
      <p className="mt-1 text-sm text-muted">Your review helps others find great contractors.</p>

      {/* Step 1 — overall rating (required) */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-muted">Overall rating <span className="text-brand">*</span></p>
        <div className="mt-2">
          <StarRating value={overallRating} onChange={setOverallRating} />
        </div>
      </div>

      {/* "Would hire again" — the headline trust signal */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-muted">Would you hire this contractor again?</p>
        <div className="mt-2 flex gap-2">
          {[["Yes", true], ["No", false]].map(([label, val]) => (
            <button
              key={label}
              type="button"
              onClick={() => setWouldHireAgain((current) => (current === val ? null : val))}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                wouldHireAgain === val
                  ? "border-primary bg-primary/20 text-accent"
                  : "border-line-strong bg-surface/80 text-muted hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — sub-ratings (optional) */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SUB_RATINGS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between rounded-xl bg-surface/60 px-3 py-2">
            <span className="text-sm font-semibold text-muted">{label}</span>
            <StarRating name={key} size="sm" value={subRatings[key] || 0} onChange={(v) => setSub(key, v)} />
          </div>
        ))}
      </div>

      {/* Step 3 — tags (optional) */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-muted">Highlights</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {REVIEW_TAGS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTag(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                tags.includes(value)
                  ? "border-success/50 bg-success/10 text-success"
                  : "border-line-strong bg-surface-2 text-muted hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 4 — written review (optional) */}
      <div className="mt-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">Your review</span>
          <textarea
            value={reviewText}
            maxLength={MAX_TEXT}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={reviewPlaceholder(overallRating)}
            className="min-h-28 w-full resize-y rounded-xl border border-line-strong bg-surface/80 px-3.5 py-3 text-sm text-content outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-subtle"
          />
        </label>
        {reviewText.length >= 800 && (
          <p className="mt-1 text-right text-xs font-semibold text-muted">{reviewText.length}/{MAX_TEXT}</p>
        )}
      </div>

      {/* Step 5 — photo upload (optional) */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-muted">Photos <span className="font-normal text-subtle">(before/after encouraged)</span></p>
        <div className="mt-2 flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div key={preview.url} className="relative h-20 w-20 overflow-hidden rounded-xl">
              <img src={preview.url} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-surface-deep/80 text-content"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line-strong text-muted transition hover:border-primary hover:text-accent">
              <ImagePlus className="h-6 w-6" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

      <Button className="mt-5 w-full" disabled={submitting}>
        {wouldHireAgain ? <ThumbsUp className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
};
