"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface SystemRevealProps {
  children: ReactNode;
}

export default function SystemReveal({
  children,
}: SystemRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`stella-system-reveal ${
        visible ? "is-visible" : ""
      }`}
    >
      {children}
    </div>
  );
}
