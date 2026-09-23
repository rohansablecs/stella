
import type { ExperimentDefinition } from "./definitions";

export type ProcedureState =
  | "WAITING"
  | "SUBJECT_DETECTED"
  | "REACH"
  | "GRASP"
  | "INTERACT"
  | "MOVE"
  | "PLACE"
  | "WITHDRAW"
  | "COMPLETE";

export type ProcedureStep = {
  id: number;
  state: ProcedureState;
  title: string;
  instruction: string;
};

export const PROCEDURE_STEPS: ProcedureStep[] = [
  {
    id: 0,
    state: "WAITING",
    title: "Await operator",
    instruction: "Position an operator inside the camera field.",
  },
  {
    id: 1,
    state: "SUBJECT_DETECTED",
    title: "Ready position",
    instruction: "Operator detected. Begin the procedure.",
  },
  {
    id: 2,
    state: "REACH",
    title: "Reach",
    instruction: "Reach toward the mission object.",
  },
  {
    id: 3,
    state: "GRASP",
    title: "Grasp",
    instruction: "Establish sustained hand-object interaction.",
  },
  {
    id: 4,
    state: "MOVE",
    title: "Manipulate",
    instruction: "Maintain interaction during manipulation.",
  },
  {
    id: 5,
    state: "PLACE",
    title: "Place",
    instruction: "Release the object.",
  },
  {
    id: 6,
    state: "WITHDRAW",
    title: "Withdraw",
    instruction: "Separate from the interaction.",
  },
  {
    id: 7,
    state: "COMPLETE",
    title: "Complete",
    instruction: "Sequence validated and recorded.",
  },
];

export function getProcedureStep(state: ProcedureState) {
  return (
    PROCEDURE_STEPS.find(
      (step) => step.state === state,
    ) ?? PROCEDURE_STEPS[0]
  );
}

export function getExperimentProgress(
  experiment: ExperimentDefinition,
  state: ProcedureState,
) {
  if (state === "WAITING") return 0;

  const index = experiment.steps.findIndex(
    (step) => step.state === state,
  );

  if (index < 0) return 0;

  return Math.round(
    ((index + 1) / experiment.steps.length) * 100,
  );
}
