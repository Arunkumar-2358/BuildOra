import { motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { ease } from "../lib/motion";

/**
 * Subtle enter transition on every route change. Re-keys on pathname so each
 * page fades + lifts in. Skipped entirely under prefers-reduced-motion.
 */
export const PageTransition = () => {
  const location = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <Outlet />;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease }}
    >
      <Outlet />
    </motion.div>
  );
};
