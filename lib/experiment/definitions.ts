
import type { ProcedureState } from "./sequence";
import type { MissionId } from "./missionStore";

export type ExperimentAction =
  | "OPERATOR_DETECTED"
  | "REACH"
  | "GRASP"
  | "MOVE"
  | "PLACE"
  | "WITHDRAW"
  | "COMPLETE";

export type ExperimentStep = {
  id: number;
  action: ExperimentAction;
  state: ProcedureState;
  title: string;
  description: string;
  guidance: string;
  required: boolean;
};

export type ExperimentDefinition = {
  id: MissionId;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  status: "DEMO" | "REFERENCE";
  steps: ExperimentStep[];
};

const sampleHandling: ExperimentDefinition = {
  id: "sample-handling",
  code: "MISSION 01",
  name: "Sample Handling",
  subtitle: "Controlled sample manipulation",
  description:
    "Detect, interact with and manipulate a sample through a validated ordered procedure.",
  status: "DEMO",
  steps: [
    {
      id: 0,
      action: "OPERATOR_DETECTED",
      state: "SUBJECT_DETECTED",
      title: "Ready position",
      description: "Establish operator presence.",
      guidance: "Operator detected. Begin the procedure.",
      required: true,
    },
    {
      id: 1,
      action: "REACH",
      state: "REACH",
      title: "Reach for sample",
      description: "Reach toward the detected sample.",
      guidance: "Reach toward the sample.",
      required: true,
    },
    {
      id: 2,
      action: "GRASP",
      state: "GRASP",
      title: "Grasp sample",
      description: "Establish sustained hand-object interaction.",
      guidance: "Grasp the sample.",
      required: true,
    },
    {
      id: 3,
      action: "MOVE",
      state: "MOVE",
      title: "Move sample",
      description: "Maintain interaction during manipulation.",
      guidance: "Move the sample.",
      required: true,
    },
    {
      id: 4,
      action: "PLACE",
      state: "PLACE",
      title: "Place sample",
      description: "Release the sample after manipulation.",
      guidance: "Place the sample and release it.",
      required: true,
    },
    {
      id: 5,
      action: "WITHDRAW",
      state: "WITHDRAW",
      title: "Withdraw",
      description: "Separate from the interaction.",
      guidance: "Withdraw from the sample.",
      required: true,
    },
    {
      id: 6,
      action: "COMPLETE",
      state: "COMPLETE",
      title: "Mission complete",
      description: "Sequence validated and recorded.",
      guidance: "Sample handling mission complete.",
      required: true,
    },
  ],
};

const sampleTransfer: ExperimentDefinition = {
  id: "sample-transfer",
  code: "MISSION 02",
  name: "Sample Transfer",
  subtitle: "Source-to-target transfer",
  description:
    "Validate a controlled transfer of a detected sample between experiment regions.",
  status: "DEMO",
  steps: [
    {
      id: 0,
      action: "OPERATOR_DETECTED",
      state: "SUBJECT_DETECTED",
      title: "Ready position",
      description: "Establish operator presence.",
      guidance: "Operator detected. Begin the transfer.",
      required: true,
    },
    {
      id: 1,
      action: "REACH",
      state: "REACH",
      title: "Reach source",
      description: "Reach toward the source sample.",
      guidance: "Reach toward the source sample.",
      required: true,
    },
    {
      id: 2,
      action: "GRASP",
      state: "GRASP",
      title: "Grasp sample",
      description: "Establish hand-object interaction.",
      guidance: "Grasp the sample.",
      required: true,
    },
    {
      id: 3,
      action: "MOVE",
      state: "MOVE",
      title: "Transfer sample",
      description: "Maintain interaction during transfer.",
      guidance: "Transfer the sample to the target.",
      required: true,
    },
    {
      id: 4,
      action: "PLACE",
      state: "PLACE",
      title: "Place at target",
      description: "Release the sample.",
      guidance: "Place the sample at the target.",
      required: true,
    },
    {
      id: 5,
      action: "WITHDRAW",
      state: "WITHDRAW",
      title: "Withdraw",
      description: "Separate from the target interaction.",
      guidance: "Withdraw from the target.",
      required: true,
    },
    {
      id: 6,
      action: "COMPLETE",
      state: "COMPLETE",
      title: "Mission complete",
      description: "Transfer sequence validated.",
      guidance: "Sample transfer mission complete.",
      required: true,
    },
  ],
};

const toolHandling: ExperimentDefinition = {
  id: "tool-handling",
  code: "MISSION 03",
  name: "Tool Handling",
  subtitle: "Tool retrieval and operation",
  description:
    "Validate retrieval, manipulation and return of an experiment tool.",
  status: "DEMO",
  steps: [
    {
      id: 0,
      action: "OPERATOR_DETECTED",
      state: "SUBJECT_DETECTED",
      title: "Ready position",
      description: "Establish operator presence.",
      guidance: "Operator detected. Begin tool handling.",
      required: true,
    },
    {
      id: 1,
      action: "REACH",
      state: "REACH",
      title: "Reach for tool",
      description: "Reach toward the detected tool.",
      guidance: "Reach toward the tool.",
      required: true,
    },
    {
      id: 2,
      action: "GRASP",
      state: "GRASP",
      title: "Grasp tool",
      description: "Establish hand-object interaction.",
      guidance: "Grasp the tool.",
      required: true,
    },
    {
      id: 3,
      action: "MOVE",
      state: "MOVE",
      title: "Move to work area",
      description: "Maintain interaction while moving the tool.",
      guidance: "Move the tool to the work area.",
      required: true,
    },
    {
      id: 4,
      action: "PLACE",
      state: "PLACE",
      title: "Return tool",
      description: "Release the tool.",
      guidance: "Return and release the tool.",
      required: true,
    },
    {
      id: 5,
      action: "WITHDRAW",
      state: "WITHDRAW",
      title: "Withdraw",
      description: "Separate from the tool.",
      guidance: "Withdraw from the tool.",
      required: true,
    },
    {
      id: 6,
      action: "COMPLETE",
      state: "COMPLETE",
      title: "Mission complete",
      description: "Tool handling sequence validated.",
      guidance: "Tool handling mission complete.",
      required: true,
    },
  ],
};

export const EXPERIMENTS: ExperimentDefinition[] = [
  sampleHandling,
  sampleTransfer,
  toolHandling,
];

export const SAMPLE_HANDLING_EXPERIMENT = sampleHandling;
export const ORBIT_EXPERIMENT = sampleHandling;

export function getExperiment(id: string): ExperimentDefinition {
  return (
    EXPERIMENTS.find(
      (experiment) => experiment.id === id,
    ) ?? SAMPLE_HANDLING_EXPERIMENT
  );
}
