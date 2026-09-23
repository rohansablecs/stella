
"use client";

import {
  useSyncExternalStore,
} from "react";

import {
  EXPERIMENTS,
} from "@/lib/experiment/definitions";

import {
  getExperimentProgress,
  type ProcedureState,
} from "@/lib/experiment/sequence";

import {
  getActiveMissionId,
  setActiveMissionId,
  subscribeMission,
} from "@/lib/experiment/missionStore";

type Props = {
  state: ProcedureState;
};

function getSnapshot() {
  return getActiveMissionId();
}

function getServerSnapshot() {
  return "sample-handling" as const;
}

export default function SequencePanel({
  state,
}: Props) {
  const missionId =
    useSyncExternalStore(
      subscribeMission,
      getSnapshot,
      getServerSnapshot,
    );

  const experiment =
    EXPERIMENTS.find(
      (item) => item.id === missionId,
    ) ?? EXPERIMENTS[0];

  const progress =
    getExperimentProgress(
      experiment,
      state,
    );

  const activeIndex =
    experiment.steps.findIndex(
      (step) => step.state === state,
    );

  const selectable =
    state === "WAITING" ||
    state === "SUBJECT_DETECTED";

  return (
    <section className="analysis-card sequence-card">
      <div className="sequence-header">
        <div>
          <div className="analysis-label">
            MISSION CONTROL
          </div>

          <strong>
            {experiment.name}
          </strong>

          <small>
            {experiment.subtitle}
          </small>
        </div>

        <span className="sequence-percent">
          {progress}%
        </span>
      </div>

      <div className="mission-picker">
        {EXPERIMENTS.map(
          (mission) => (
            <button
              key={mission.id}
              type="button"
              disabled={!selectable}
              className={[
                "mission-option",
                mission.id === missionId
                  ? "selected"
                  : "",
              ]
                .join(" ")
                .trim()}
              onClick={() =>
                setActiveMissionId(
                  mission.id,
                )
              }
            >
              <span>
                {mission.code}
              </span>

              <strong>
                {mission.name}
              </strong>

              <small>
                {mission.subtitle}
              </small>
            </button>
          ),
        )}
      </div>

      <div className="sequence-progress">
        <span
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mission-current-guidance">
        <span>
          {state === "COMPLETE"
            ? "MISSION COMPLETE"
            : "NEXT ACTION"}
        </span>

        <strong>
          {state === "WAITING"
            ? "Await operator"
            : experiment.steps.find(
                (step) =>
                  step.state === state,
              )?.guidance ??
              experiment.steps[0]
                ?.guidance}
        </strong>
      </div>

      <div className="sequence-list">
        {experiment.steps.map(
          (step, index) => {
            const active =
              step.state === state;

            const completed =
              activeIndex >= 0 &&
              index < activeIndex;

            return (
              <div
                key={step.id}
                className={[
                  "sequence-step",
                  active
                    ? "active"
                    : "",
                  completed
                    ? "completed"
                    : "",
                ]
                  .join(" ")
                  .trim()}
              >
                <span className="sequence-number">
                  {completed
                    ? "✓"
                    : String(
                        step.id + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                </span>

                <div>
                  <strong>
                    {step.title}
                  </strong>

                  <small>
                    {step.description}
                  </small>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
