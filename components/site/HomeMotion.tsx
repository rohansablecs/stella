"use client";

import { useEffect } from "react";

export default function HomeMotion() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) return;

    const selectors = [
      ".stella-introduction-section > *",
      ".stella-experience-section > *",
      ".stella-resources-section > *",
      ".stella-technology-section > *",
      ".final-section > *",
    ];

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        selectors.join(",")
      )
    );

    elements.forEach((element, index) => {
      if (
        element.closest(".stella-floating-nav") ||
        element.closest(".stella-hero")
      ) {
        return;
      }

      element.classList.add("stella-auto-reveal");

      const delay =
        Math.min(index % 8, 7) * 55;

      element.style.setProperty(
        "--auto-delay",
        `${delay}ms`
      );
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;

          element.dataset.visible = "true";

          observer.unobserve(element);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    elements.forEach((element) => {
      if (!element.classList.contains("stella-auto-reveal")) {
        return;
      }

      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
