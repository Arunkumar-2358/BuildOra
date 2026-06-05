import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ease } from "../../lib/motion";
import { Avatar } from "../ui/Avatar";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";

const ITEMS = [
  {
    quote:
      "We had three serious, scoped bids within two days. BuildOra made comparing contractors feel effortless — and the chat history kept our whole renovation organised.",
    name: "Priya Menon",
    role: "Homeowner · Hyderabad",
    rating: 5
  },
  {
    quote:
      "Lead quality is in a different league to generic listing apps. The matching actually sends me projects I can win, and my verified profile does the selling.",
    name: "Urban Nest Studio",
    role: "Interior contractor · Bengaluru",
    rating: 5
  },
  {
    quote:
      "Transparent quotes and a clean paper trail. I awarded my villa project with total confidence and never lost track of a single decision.",
    name: "Rohan Shetty",
    role: "Customer · Chennai",
    rating: 5
  }
];

export const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();

  const go = useCallback((next) => {
    setDir(next > index ? 1 : -1);
    setIndex((next + ITEMS.length) % ITEMS.length);
  }, [index]);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % ITEMS.length);
    }, 6000);
    return () => clearInterval(id);
  }, [reduce]);

  const item = ITEMS[index];

  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Loved by both sides"
          title="Trusted by homeowners and contractors."
          className="mx-auto"
        />

        <div className="relative mx-auto mt-12 max-w-3xl">
          <Quote className="absolute -top-6 left-1/2 h-16 w-16 -translate-x-1/2 text-brand/10" />
          <div className="premium-card relative overflow-hidden rounded-3xl px-6 py-10 md:px-12 md:py-12">
            <div className="min-h-[200px] md:min-h-[176px]">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.figure
                  key={index}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div className="flex justify-center gap-1 text-spark">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-6 text-balance text-center text-xl font-semibold leading-8 text-content md:text-2xl md:leading-9">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-8 flex items-center justify-center gap-3">
                    <Avatar name={item.name} size="md" />
                    <div className="text-left">
                      <p className="font-bold text-content">{item.name}</p>
                      <p className="text-sm text-muted">{item.role}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous testimonial"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-muted transition hover:border-brand/40 hover:text-brand"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {ITEMS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-7 bg-brand" : "w-2 bg-line-strong hover:bg-subtle"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next testimonial"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-muted transition hover:border-brand/40 hover:text-brand"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
};
