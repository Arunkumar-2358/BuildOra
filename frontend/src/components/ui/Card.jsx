import { cn } from "../../lib/cn";

/**
 * Base surface for panels and cards. `hover` opts into the lift + red-glow
 * interaction; `glass` swaps to the translucent treatment.
 */
export const Card = ({ as: Tag = "div", hover = false, glass = false, className, children, ...props }) => (
  <Tag
    className={cn(
      glass ? "glass" : "premium-card",
      "rounded-2xl",
      hover && "card-hover",
      className
    )}
    {...props}
  >
    {children}
  </Tag>
);
