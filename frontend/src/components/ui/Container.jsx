import { cn } from "../../lib/cn";

/** Consistent page gutter + max width used across every screen. */
export const Container = ({ as: Tag = "div", className, children, ...props }) => (
  <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props}>
    {children}
  </Tag>
);
