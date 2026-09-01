"use client";

import { useEffect, useRef, useState } from "react";

/** Animated count-up for stat tiles; renders the final value immediately
 * when the user prefers reduced motion. */
export default function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const dur = 900;
        const tick = (t: number) => {
          const k = Math.min((t - t0) / dur, 1);
          setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return <span ref={ref}>{shown.toLocaleString("he-IL")}</span>;
}
