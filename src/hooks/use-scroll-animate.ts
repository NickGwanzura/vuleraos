"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A simple Intersection Observer hook that returns a ref and a boolean.
 * Elements with `animate-in` classes via `tw-animate-css` will animate
 * when they become visible.
 */
export function useScrollAnimate(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // Only animate once
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
