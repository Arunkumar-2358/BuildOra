// Pre-defined tag chips a reviewer can pick. Values mirror the backend enum.
export const REVIEW_TAGS = [
  { value: "on_time", label: "On time" },
  { value: "clean_workspace", label: "Clean workspace" },
  { value: "great_communication", label: "Great communication" },
  { value: "would_hire_again", label: "Would hire again" },
  { value: "fair_pricing", label: "Fair pricing" },
  { value: "high_quality", label: "High quality" }
];

export const TAG_LABELS = Object.fromEntries(REVIEW_TAGS.map((tag) => [tag.value, tag.label]));

export const SUB_RATINGS = [
  { key: "quality", label: "Quality of work" },
  { key: "communication", label: "Communication" },
  { key: "timeliness", label: "Timeliness" },
  { key: "value", label: "Value for money" }
];

// Contextual placeholder copy that adapts to the chosen star rating.
export const reviewPlaceholder = (rating) => {
  if (rating >= 5) return "What made this contractor stand out?";
  if (rating === 4) return "What went well on this project?";
  if (rating === 3) return "What went well? What could be improved?";
  if (rating >= 1) return "We're sorry to hear that. What happened?";
  return "Share the details of your experience...";
};
