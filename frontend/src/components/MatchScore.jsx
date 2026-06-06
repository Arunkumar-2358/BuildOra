import { Sparkles } from "lucide-react";

const tone = (score) => {
  if (score >= 90) return "border-success/40 bg-success/10 text-success";
  if (score >= 75) return "border-brand/40 bg-brand/10 text-brand";
  if (score >= 60) return "border-spark/40 bg-spark/10 text-spark";
  return "border-line-strong bg-surface-2 text-muted";
};

// Compact match badge: "92% · Best Match".
export const MatchScore = ({ score = 0, label, showLabel = true }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tone(score)}`}>
    <Sparkles className="h-3.5 w-3.5" />
    {score}% match{showLabel && label ? ` · ${label}` : ""}
  </span>
);

// Larger ring-style display for cards.
export const MatchRing = ({ score = 0 }) => (
  <div className="relative grid h-14 w-14 place-items-center">
    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(var(--surface-2))" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke={score >= 90 ? "#0F9D6B" : score >= 75 ? "#D62D14" : "#FB7A1E"}
        strokeWidth="3"
        strokeDasharray={`${(score / 100) * 97.4} 97.4`}
        strokeLinecap="round"
      />
    </svg>
    <span className="text-sm font-extrabold text-content">{score}</span>
  </div>
);
