"use client";

import { useEffect, useState } from "react";

export default function MissionSwitchNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const missionButton = target.closest(
        ".mission-option"
      ) as HTMLButtonElement | null;

      if (!missionButton) return;

      /*
       * Mission buttons become disabled once a session has started.
       * Pointer events still let us catch the user's attempt to click
       * the locked control and explain what is happening.
       */
      if (missionButton.disabled) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
        true
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="mission-lock-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-lock-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="mission-lock-modal">
        <div className="mission-lock-index">
          SESSION CONTROL / 01
        </div>

        <div className="mission-lock-mark">!</div>

        <div className="mission-lock-copy">
          <div className="mission-lock-label">
            MISSION LOCKED
          </div>

          <h2 id="mission-lock-title">
            Session already in progress.
          </h2>

          <p>
            Mission selection is locked once the procedure has
            started. To switch to another mission, reset the
            current session first.
          </p>
        </div>

        <button
          type="button"
          className="mission-lock-dismiss"
          onClick={() => setOpen(false)}
          autoFocus
        >
          <span>UNDERSTOOD</span>
          <span>↗</span>
        </button>
      </div>
    </div>
  );
}
