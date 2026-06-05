import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "../../lib/cn";
import { ease } from "../../lib/motion";

const offscreen = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" }
};

const posClass = {
  right: "inset-y-0 right-0 h-full w-[88%] max-w-sm",
  left: "inset-y-0 left-0 h-full w-[88%] max-w-sm",
  bottom: "inset-x-0 bottom-0 w-full rounded-t-3xl"
};

/** Slide-over drawer for mobile menus / filters. Locks body scroll while open. */
export const Sheet = ({ open, onClose, side = "right", className, children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={cn(
              "absolute border border-line bg-surface shadow-xl",
              posClass[side],
              className
            )}
            initial={offscreen[side]}
            animate={{ x: 0, y: 0 }}
            exit={offscreen[side]}
            transition={{ duration: 0.32, ease }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
