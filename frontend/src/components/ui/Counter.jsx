import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ease } from "../../lib/motion";

/**
 * Animated number counter — ticks from 0 to `value` the first time it scrolls
 * into view. Pass a `format` fn for currency/compact display.
 */
export const Counter = ({
  value = 0,
  duration = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
  format,
  className
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value, {
      duration,
      ease,
      onUpdate: (latest) => setDisplay(latest)
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const text = format
    ? format(display)
    : `${prefix}${display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
};
