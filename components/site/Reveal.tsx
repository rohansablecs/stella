"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  scale?: number;
};

export default function Reveal({
  children,
  delay = 0,
  duration = 900,
  distance = 34,
  scale = 1,
  className = "",
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      element.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        element.dataset.revealed = "true";
        observer.unobserve(element);
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`stella-reveal ${className}`}
      style={{
        "--reveal-delay": `${delay}ms`,
        "--reveal-duration": `${duration}ms`,
        "--reveal-distance": `${distance}px`,
        "--reveal-scale": scale,
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
