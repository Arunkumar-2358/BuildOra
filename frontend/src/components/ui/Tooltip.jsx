import { cn } from "../../lib/cn";

const sideClass = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2"
};

/** Lightweight CSS hover/focus tooltip — no portal, good enough for icon hints. */
export const Tooltip = ({ label, side = "top", children, className }) => (
  <span className="group/tt relative inline-flex">
    {children}
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:bg-ink-700",
        sideClass[side],
        className
      )}
    >
      {label}
    </span>
  </span>
);
