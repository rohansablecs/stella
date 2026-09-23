export type Activity =
  | "NO SUBJECT"
  | "STANDING"
  | "SITTING"
  | "WALKING"
  | "REACHING"
  | "INTERACTION";

export type TrackedObject = {
  id: number;
  label: string;
  score: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Interaction = {
  active: boolean;
  object: TrackedObject | null;
  hand: Point | null;
  distance: number;
};

export type PerceptionState = {
  activity: Activity;
  confidence: number;
  poseDetected: boolean;
  handCount: number;
  objectCount: number;
  interaction: boolean;
};