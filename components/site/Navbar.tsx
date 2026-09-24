"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isFeaturePage =
    pathname === "/live" ||
    pathname === "/simulations" ||
    pathname.startsWith("/simulations/");

  /* =====================================================
     LIVE / SIMULATIONS
     STELLA → HOME → CURRENT PAGE
     ===================================================== */

  if (isFeaturePage) {
    const currentPage =
      pathname === "/live"
        ? "Live AI"
        : "Simulations";

    return createPortal(
      <header className="stella-navbar">
        <div className="stella-navbar-inner">

          <Link
            href="/"
            className="stella-navbar-brand"
            aria-label="STELLA home"
          >
            <img
              src="/brand/logo.png"
              alt="STELLA"
              className="stella-navbar-logo"
            />
            <span>STELLA</span>
          </Link>

          <nav
            className="stella-navbar-context"
            aria-label="Current page"
          >
            <span className="stella-navbar-current">
              {currentPage}
            </span>
          </nav>

        </div>
      </header>,
      document.body
    );
  }

  /* =====================================================
     HOMEPAGE
     FULL ORIGINAL NAVIGATION
     ===================================================== */

  return createPortal(
    <header className="stella-navbar">
      <div className="stella-navbar-inner">

        <Link
          href="/"
          className="stella-navbar-brand"
        >
          <img
            src="/brand/logo.png"
            alt="STELLA"
            className="stella-navbar-logo"
          />

          <span>STELLA</span>
        </Link>

        <nav className="stella-navbar-links">
          <a href="#about">About</a>
          <a href="/live">Live AI</a>
          <a href="/simulations">Simulations</a>
          <a href="#system">System</a>
          <a href="#resources">Resources</a>
        </nav>

        <Link
          href="/live"
          className="stella-navbar-launch"
        >
          Launch
          <span>↗</span>
        </Link>

      </div>
    </header>,
    document.body
  );
}
