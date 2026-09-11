import * as React from "react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/*
 * Header affix state. Toggles once per threshold crossing —
 * no per-frame re-renders while scrolling within a bucket.
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > threshold;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold]);
  return scrolled;
}

/*
 * Thin scroll-progress bar. Writes transform directly to the DOM
 * inside rAF — no React renders on scroll.
 */
export function ScrollProgress({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-[70] h-[2px] pointer-events-none scroll-progress",
        className
      )}
      {...props}
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-primary via-primary-glow to-secondary"
      />
    </div>
  );
}

/*
 * Hero recede / parallax. Sets `--hero-progress` (0..1) on the given
 * element based on scroll, within a rAF-throttled passive listener.
 * Writes to style directly — zero React re-renders.
 */
export function useHeroRecede<T extends HTMLElement>(
  distance = 300
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--hero-progress", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / distance));
      el.style.setProperty("--hero-progress", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [distance]);
  return ref;
}

/*
 * Scroll-linked reveal. Adds `is-revealed` (pure DOM class change, no
 * re-render) when the element begins to enter the viewport. Stagger via
 * the `delay` prop (inline --reveal-delay).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-revealed");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-revealed");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      data-reveal
      className={cn(className)}
      style={
        { "--reveal-delay": `${Math.min(delay, 420)}ms` } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Tag>
  );
}

/*
 * Route-transition wrapper. Keys the subtree by pathname so each
 * navigation replays a single fade/rise with no flash between pages.
 * Also resets scroll so spatial context is clean on every page change.
 */
export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const pathname = location.pathname + location.search;
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}