export type SimulationEvent = {
  time: number;
  label: string;
  type:
    | "DETECTED"
    | "VALID"
    | "WARNING";
};

export type Simulation = {
  id: string;
  code: string;
  title: string;
  category: string;

  description: string;
  objective: string;

  video: string;
  replay: string;

  duration: string;

  events: SimulationEvent[];

  capabilities: string[];
};

export const SIMULATIONS: Simulation[] = [
  {
    id: "orbit-demo",

    code: "ORBIT",

    title:
      "Orbital manipulation sequence",

    category:
      "Human-object interaction",

    description:
      "Recorded demonstration footage showing an operator performing a structured manipulation sequence.",

    objective:
      "Demonstrate how STELLA observes operator movement and replays precomputed perception data over recorded footage.",

    video:
      "/simulations/orbit/source.mp4",

    replay:
      "/simulations/orbit/replay.json",

    duration:
      "01:18",

    events: [
      {
        time: 0,
        label:
          "Operator detected",
        type: "DETECTED",
      },

      {
        time: 12,
        label:
          "Reach phase",
        type: "DETECTED",
      },

      {
        time: 27,
        label:
          "Interaction established",
        type: "VALID",
      },

      {
        time: 43,
        label:
          "Manipulation sequence",
        type: "VALID",
      },

      {
        time: 58,
        label:
          "Interaction released",
        type: "VALID",
      },

      {
        time: 72,
        label:
          "Procedure complete",
        type: "VALID",
      },
    ],

    capabilities: [
      "Human detection",
      "Pose estimation",
      "Hand tracking",
      "Object relationship",
      "Sequence validation",
      "Event recording",
    ],
  },

  {
    id: "apollo-demo",

    code: "APOLLO",

    title:
      "Procedural activity sequence",

    category:
      "Activity recognition",

    description:
      "Recorded activity sequence prepared for demonstrating temporal action interpretation.",

    objective:
      "Demonstrate recognition of ordered operator actions from cached perception data.",

    video:
      "/simulations/apollo/source.mp4",

    replay:
      "/simulations/apollo/replay.json",

    duration: "—",

    events: [
      {
        time: 0,
        label:
          "Operator detected",
        type: "DETECTED",
      },

      {
        time: 4,
        label:
          "Activity transition",
        type: "DETECTED",
      },

      {
        time: 8,
        label:
          "Procedure state updated",
        type: "VALID",
      },
    ],

    capabilities: [
      "Activity recognition",
      "Temporal reasoning",
      "Pose estimation",
      "State tracking",
      "Structured logging",
    ],
  },

  {
    id: "lunaris-demo",

    code: "LUNARIS",

    title:
      "Experiment assistance sequence",

    category:
      "Guidance and correction",

    description:
      "Recorded demonstration footage for examining operator actions against an expected procedure.",

    objective:
      "Demonstrate the relationship between perception, experiment state and operator guidance using precomputed analysis.",

    video:
      "/simulations/lunaris/source.mp4",

    replay:
      "/simulations/lunaris/replay.json",

    duration: "—",

    events: [
      {
        time: 0,
        label:
          "Operator detected",
        type: "DETECTED",
      },

      {
        time: 5,
        label:
          "Expected action",
        type: "VALID",
      },

      {
        time: 9,
        label:
          "Procedure state updated",
        type: "VALID",
      },
    ],

    capabilities: [
      "Activity recognition",
      "Sequence validation",
      "Guidance",
      "Correction",
      "Event recording",
    ],
  },
];

export function getSimulation(
  id: string,
) {
  return SIMULATIONS.find(
    (simulation) =>
      simulation.id === id,
  );
}