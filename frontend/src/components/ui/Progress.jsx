import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { ease } from "../../lib/motion";

/** Slim animated progress bar (steppers, completion, ratings breakdown). */
export const Progress = ({ value = 0, className, barClassName, tone = "brand" }) => {
  const tones = {
    brand: "bg-brand",
    spark: "bg-spark",
    success: "bg-success",
    ink: "bg-ink-900 dark:bg-white"
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div
        className={cn("h-full rounded-full", tones[tone], barClassName)}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease }}
      />
    </div>
  );
};
