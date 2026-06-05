import { cn } from "../../lib/cn";

/** Seamless infinite horizontal scroller (logos / trust strip). Pauses on hover. */
export const Marquee = ({ children, className }) => (
  <div className={cn("group relative flex overflow-hidden", className)}>
    <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused]">
      {children}
    </div>
    <div
      aria-hidden
      className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused]"
    >
      {children}
    </div>
  </div>
);
