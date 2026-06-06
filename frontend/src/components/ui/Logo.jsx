import { cn } from "../../lib/cn";

/**
 * BuildOra brand mark — rising structural bars (build + growth) crowned by a
 * warm-orange spark, set in a Construction-Red gradient tile.
 */
export const LogoMark = ({ size = 40, className }) => (
  <span
    className={cn(
      "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-gradient shadow-glow-sm",
      className
    )}
    style={{ height: size, width: size }}
  >
    <svg viewBox="0 0 32 32" className="h-3/5 w-3/5" fill="none" aria-hidden="true">
      <rect x="5.5" y="17.5" width="4.6" height="8.5" rx="1.6" fill="white" fillOpacity="0.85" />
      <rect x="13.7" y="12.5" width="4.6" height="13.5" rx="1.6" fill="white" />
      <rect x="21.9" y="7.5" width="4.6" height="18.5" rx="1.6" fill="white" fillOpacity="0.95" />
      <circle cx="24.2" cy="5" r="2.5" fill="#FFC487" />
    </svg>
  </span>
);

export const Logo = ({ markSize = 40, showWord = true, gradient = true, className, wordClassName }) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    <LogoMark size={markSize} />
    {showWord && (
      <span className={cn("font-display text-xl font-extrabold tracking-tight text-content", wordClassName)}>
        Build<span className={gradient ? "brand-text-gradient" : undefined}>Ora</span>
      </span>
    )}
  </span>
);
