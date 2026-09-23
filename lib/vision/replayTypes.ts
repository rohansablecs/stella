export type ReplayActivity =
  | "NO_PERSON"
  | "PERSON_DETECTED"
  | "STABLE"
  | "REACHING"
  | "HAND_MOVEMENT"
  | "OBJECT_PROXIMITY"
  | "OBJECT_INTERACTION"
  | "WITHDRAWAL"
  | "UNKNOWN";

/* =========================================================
   Semantic experiment actions
   ========================================================= */

export type ReplayAction =
  | "WAITING"
  | "OPERATOR_DETECTED"
  | "REACH"
  | "GRASP"
  | "MOVE"
  | "PLACE"
  | "WITHDRAW"
  | "COMPLETE"
  | "UNKNOWN";

/* =========================================================
   Mission / procedure
   ========================================================= */

export type ReplayMission =
  | "SAMPLE_HANDLING"
  | "SAMPLE_TRANSFER"
  | "TOOL_HANDLING";

export type ReplayEvidence =
  | "PERSON_DETECTED"
  | "HAND_DETECTED"
  | "TARGET_DETECTED"
  | "HAND_APPROACHING_TARGET"
  | "HAND_OBJECT_CONTACT"
  | "SUSTAINED_INTERACTION"
  | "OBJECT_MOVEMENT"
  | "INTERACTION_RELEASED"
  | "OPERATOR_WITHDRAWAL";

/* =========================================================
   Shared vision primitives
   ========================================================= */

export type ReplayLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type ReplayPerson = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReplayHand = {
  x: number;
  y: number;

  handedness: string;
  landmarks: ReplayLandmark[];

  centerX: number;
  centerY: number;

  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type ReplayObject = {
  id: string;
  label: string;
  score: number;

  x: number;
  y: number;
  width: number;
  height: number;

  centerX: number;
  centerY: number;
};

export type ReplayInteraction = {
  active: boolean;
  handIndex: number | null;
  objectIndex: number | null;
  label: string;

  distance?: number;
};

export type ReplayStep = {
  current: number;
  total: number;
  id: string;
  label: string;
  description: string;
  status: "PENDING" | "CURRENT" | "COMPLETE";
};

export type ReplayEvent = {
  id: string;
  time: number;

  /*
   * Legacy activity field retained for ReplayAI and
   * SimulationAnalysisLayer compatibility.
   */
  activity: ReplayActivity;

  /*
   * Optional because legacy ReplayAI and
   * SimulationAnalysisLayer still create compact events.
   * Precomputed semantic events populate all of these.
   */
  action?: ReplayAction;
  step?: ReplayStep;
  confidence: number;
  message: string;
  evidence?: ReplayEvidence[];
};

/* =========================================================
   Pose
   ========================================================= */

export type ReplayPose = {
  landmarks: ReplayLandmark[];

  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  centerX: number;
  centerY: number;
};

/* =========================================================
   Cached replay frame
   ========================================================= */

export type ReplayPoint = {
  time: number;

  activity: ReplayActivity;
  confidence: number;

  /*
   * Semantic interpretation.
   */
  action: ReplayAction;
  actionConfidence: number;

  /*
   * Mission this frame belongs to.
   */
  mission: ReplayMission;

  /*
   * Evidence used to derive the action.
   */
  evidence: ReplayEvidence[];

  person: ReplayPerson | null;

  hands: ReplayHand[];

  objects: ReplayObject[];

  interaction: ReplayInteraction;

  step: ReplayStep;

  motion: number;
};

/* =========================================================
   Legacy compatibility
   ========================================================= */

export type ReplayFrame = ReplayPoint & {
  pose?: ReplayPose | null;
  nearestObjectDistance?: number | null;
};

/* =========================================================
   Persistent replay file
   ========================================================= */

export type ReplayFile = {
  version: 2;
  simulationId: string;
  sourceVideo: string;

  mission: ReplayMission;

  generatedAt: string;

  sampleInterval: number;
  duration: number;

  frames: ReplayPoint[];

  events: ReplayEvent[];
};
