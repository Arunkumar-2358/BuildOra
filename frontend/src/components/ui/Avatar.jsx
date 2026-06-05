import { cn } from "../../lib/cn";

const SIZES = {
  xs: "h-7 w-7 text-[0.65rem]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl"
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

/** Avatar with graceful initials fallback and optional online/verified ring. */
export const Avatar = ({ src, name, size = "md", ring = false, status, className }) => (
  <span className={cn("relative inline-grid place-items-center", className)}>
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-full font-bold text-white",
        "bg-gradient-to-br from-brand-500 to-brand-700",
        ring && "ring-2 ring-surface ring-offset-2 ring-offset-surface",
        SIZES[size]
      )}
    >
      {src ? (
        <img src={src} alt={name || "avatar"} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
    {status && (
      <span
        className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface",
          status === "online" ? "bg-success" : "bg-subtle"
        )}
      />
    )}
  </span>
);
