"use client";

import { useEffect, useRef, useState } from "react";

type Outcome = "success" | "failure" | null;

export default function MissionOutcome() {
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [mission, setMission] = useState("CURRENT MISSION");

  const outcomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completedRef = useRef(false);

  useEffect(() => {
    const clearTimers = () => {
      if (outcomeTimer.current) {
        clearTimeout(outcomeTimer.current);
      }

      if (restartTimer.current) {
        clearTimeout(restartTimer.current);
      }
    };

    const getMissionName = () => {
      const header = document.querySelector(
        ".sequence-header strong"
      );

      return header?.textContent?.trim() || "CURRENT MISSION";
    };

    const restartMission = () => {
      /*
       * Use the existing LiveAI RESET SESSION button.
       * We deliberately do not touch LiveAI.tsx or its functions.
       */
      const buttons = Array.from(
        document.querySelectorAll("button")
      );

      const resetButton = buttons.find((button) =>
        /reset session/i.test(button.textContent || "")
      );

      if (resetButton) {
        resetButton.click();
      }
    };

    const showSuccess = () => {
      if (completedRef.current) return;

      completedRef.current = true;

      setMission(getMissionName());
      setOutcome("success");

      /*
       * Leave the success message visible long enough to actually
       * communicate that the mission was completed.
       */
      restartTimer.current = setTimeout(() => {
        restartMission();

        /*
         * Allow the next mission run to produce another completion.
         */
        setTimeout(() => {
          completedRef.current = false;
          setOutcome(null);
        }, 250);
      }, 2500);

      outcomeTimer.current = setTimeout(() => {
        setOutcome(null);
      }, 6000);
    };

    const showFailure = () => {
      setMission(getMissionName());
      setOutcome("failure");

      if (outcomeTimer.current) {
        clearTimeout(outcomeTimer.current);
      }

      outcomeTimer.current = setTimeout(() => {
        setOutcome(null);
      }, 6000);
    };

    const inspect = () => {
      const percentElement =
        document.querySelector(".sequence-percent");

      const percentText =
        percentElement?.textContent?.trim() || "";

      const percent = Number(
        percentText.replace("%", "").trim()
      );

      /*
       * SUCCESS
       *
       * The existing sequence reaches 100% when the validator
       * completes the mission.
       */
      if (percent >= 100) {
        showSuccess();
        return;
      }

      /*
       * Optional terminal failure detection.
       * Normal recoverable warnings are intentionally NOT failures.
       */
      const pageText =
        document.body.innerText || "";

      if (
        /\bMISSION FAILED\b/i.test(pageText) ||
        /\bSEQUENCE FAILED\b/i.test(pageText) ||
        /\bINVALID SEQUENCE\b/i.test(pageText)
      ) {
        showFailure();
      }
    };

    const observer = new MutationObserver(inspect);

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleMissionResult = (event: Event) => {
      const custom =
        event as CustomEvent<{
          status?: "success" | "failure";
          mission?: string;
        }>;

      if (!custom.detail?.status) return;

      setMission(
        custom.detail.mission || getMissionName()
      );

      if (custom.detail.status === "success") {
        showSuccess();
      } else {
        showFailure();
      }
    };

    window.addEventListener(
      "stella:mission-result",
      handleMissionResult
    );

    inspect();

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "stella:mission-result",
        handleMissionResult
      );

      clearTimers();
    };
  }, []);

  if (!outcome) return null;

  const success = outcome === "success";

  return (
    <div
      className={`mission-outcome mission-outcome-${outcome}`}
      role="status"
      aria-live="assertive"
    >
      <div className="mission-outcome-mark">
        {success ? "✓" : "!"}
      </div>

      <div className="mission-outcome-copy">
        <span className="mission-outcome-kicker">
          {success
            ? "MISSION SUCCESSFUL"
            : "MISSION NOT COMPLETED"}
        </span>

        <strong>
          {success
            ? `${mission} complete`
            : `${mission} requires another attempt`}
        </strong>

        <p>
          {success
            ? "Sequence validated. Restarting mission…"
            : "Reset the session and try again, or select a different mission."}
        </p>
      </div>

      <button
        type="button"
        className="mission-outcome-close"
        aria-label="Dismiss mission result"
        onClick={() => setOutcome(null)}
      >
        ×
      </button>
    </div>
  );
}
