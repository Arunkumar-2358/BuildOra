import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "../../lib/cn";
import { layoutSpring } from "../../lib/motion";

/**
 * Underline tabs with a gliding brand indicator.
 * `tabs`: [{ value, label, icon?, count? }].
 */
export const Tabs = ({ tabs, value, onChange, className }) => {
  const groupId = useId();
  return (
    <div role="tablist" className={cn("flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-line", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors",
              active ? "text-content" : "text-muted hover:text-content"
            )}
          >
            <span className="inline-flex items-center gap-2">
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
              {tab.count != null && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold", active ? "bg-brand/10 text-brand" : "bg-surface-2 text-subtle")}>
                  {tab.count}
                </span>
              )}
            </span>
            {active && (
              <motion.span
                layoutId={`tab-${groupId}`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                transition={layoutSpring}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
