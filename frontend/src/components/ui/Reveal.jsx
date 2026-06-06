import { motion, useReducedMotion } from "framer-motion";
import { ease, inViewport, staggerContainer } from "../../lib/motion";

/**
 * Scroll-reveal wrapper — fades + lifts content into view once. Honors
 * prefers-reduced-motion by rendering statically.
 */
export const Reveal = ({ children, delay = 0, y = 20, once = true, className, as = "div", ...props }) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} {...props}>
        {children}
      </Tag>
    );
  }
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ ...inViewport, once }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
};

/** Stagger container — children using <RevealItem> cascade in. */
export const Stagger = ({ children, stagger = 0.08, delay = 0, once = true, className, as = "div", ...props }) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} {...props}>
        {children}
      </Tag>
    );
  }
  return (
    <MotionTag
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ ...inViewport, once }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } }
};

export const RevealItem = ({ children, className, as = "div", ...props }) => {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag variants={itemVariants} className={className} {...props}>
      {children}
    </MotionTag>
  );
};
