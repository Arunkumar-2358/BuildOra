import { BadgeCheck, MessageSquare, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api";
import { relativeTime } from "../utils/format";
import { TAG_LABELS } from "../utils/reviews";
import { Button } from "./Button";
import { StarDisplay } from "./StarRating";

const REPLY_MAX = 500;

export const ReviewCard = ({ review, currentUser, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState({
    count: review.helpfulCount || 0,
    voted: (review.helpfulVoters || []).some((id) => id === currentUser?._id)
  });
  const [replyText, setReplyText] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [error, setError] = useState("");

  const reviewer = review.customer;
  const reviewerName = reviewer?.name || "A Buildora Client";
  const initial = reviewerName.charAt(0).toUpperCase();
  const isContractor = currentUser?._id === (review.contractor?._id || review.contractor);
  const longText = (review.reviewText || "").length > 220;

  const toggleHelpful = async () => {
    const { data } = await api.post(`/reviews/${review._id}/helpful`);
    setHelpful({ count: data.helpfulCount, voted: data.hasVoted });
  };

  const postReply = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/reviews/${review._id}/reply`, { replyText: replyText.trim() });
      setReplyOpen(false);
      setReplyText("");
      onUpdated?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to post reply");
    }
  };

  return (
    <div className="rounded-2xl border border-line/60 bg-surface/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient text-sm font-extrabold text-white">
            {initial}
          </div>
          <div>
            <p className="font-bold text-content">{reviewerName}</p>
            <p className="text-xs text-muted">{relativeTime(review.createdAt)}</p>
          </div>
        </div>
        {review.isVerifiedProject && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified Project
          </span>
        )}
      </div>

      <div className="mt-3">
        <StarDisplay value={review.overallRating} size="sm" />
      </div>

      {review.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
              {TAG_LABELS[tag] || tag}
            </span>
          ))}
        </div>
      )}

      {review.reviewText && (
        <p className={`mt-3 text-sm leading-6 text-muted ${!expanded && longText ? "line-clamp-3" : ""}`}>
          {review.reviewText}
        </p>
      )}
      {longText && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-bold text-accent">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {review.photos?.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {review.photos.map((photo, index) => (
            <img
              key={photo.url || index}
              src={photo.url}
              alt={`Project photo ${index + 1}`}
              className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={toggleHelpful}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            helpful.voted
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-line-strong text-muted hover:border-line-strong"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Helpful{helpful.count ? ` · ${helpful.count}` : ""}
        </button>
        {isContractor && !review.reply?.text && !replyOpen && (
          <button
            onClick={() => setReplyOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-content"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reply to this review
          </button>
        )}
      </div>

      {/* Contractor reply — visually distinct, indented block */}
      {review.reply?.text && (
        <div className="mt-4 rounded-xl border-l-2 border-primary bg-surface-2/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">
            Response from {review.contractor?.contractorProfile?.businessName || review.contractor?.name || "the contractor"}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-muted">{review.reply.text}</p>
        </div>
      )}

      {isContractor && replyOpen && !review.reply?.text && (
        <form onSubmit={postReply} className="mt-4 rounded-xl bg-surface-2/60 p-4">
          <p className="text-xs text-muted">
            Professional replies build trust. Thank your client and address feedback constructively. Your reply is public.
          </p>
          <textarea
            value={replyText}
            maxLength={REPLY_MAX}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            className="mt-2 min-h-20 w-full resize-y rounded-xl border border-line-strong bg-surface/80 px-3 py-2 text-sm text-content outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-subtle">{replyText.length}/{REPLY_MAX}</span>
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-brand">{error}</p>}
          <div className="mt-2 flex gap-2">
            <Button type="submit" className="px-4 py-2 text-xs" disabled={!replyText.trim()}>Post reply</Button>
            <Button type="button" variant="ghost" className="px-4 py-2 text-xs" onClick={() => setReplyOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};
