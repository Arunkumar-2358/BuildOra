import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and de-dupe conflicting Tailwind utilities. */
export const cn = (...inputs) => twMerge(clsx(inputs));
