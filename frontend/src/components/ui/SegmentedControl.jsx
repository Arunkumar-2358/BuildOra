import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "../../lib/cn";
import { layoutSpring } from "../../lib/motion";

/**
 * Pill toggle with a shared-layout indicator that glides between options.
 * `options`: [{ value, label, icon? }].
 */
export const SegmentedControl = ({ options, value, onChange, size = "md", className }) => {
  const groupId = useId();
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface-2/70 p-1 backdrop-blur",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-full font-semibold transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active ? "text-white" : "text-muted hover:text-content"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${groupId}`}
                className="absolute inset-0 rounded-full bg-brand shadow-glow-sm"
                transition={layoutSpring}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon && <opt.icon className="h-4 w-4" />}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
