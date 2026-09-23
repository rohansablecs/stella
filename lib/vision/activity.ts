
import type {
  HandLandmarkerResult,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

import type {
  Activity,
  Point,
} from "./types";

function distance(
  a: Point,
  b: Point,
) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
  );
}

function midpoint(
  a: Point,
  b: Point,
): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function point(
  landmark:
    | {
        x?: number;
        y?: number;
        visibility?: number;
      }
    | undefined,
): Point | null {
  if (
    !landmark ||
    typeof landmark.x !== "number" ||
    typeof landmark.y !== "number"
  ) {
    return null;
  }

  return {
    x: landmark.x,
    y: landmark.y,
  };
}

function visible(
  landmark:
    | {
        visibility?: number;
      }
    | undefined,
) {
  return (
    landmark &&
    (
      landmark.visibility === undefined ||
      landmark.visibility >= 0.35
    )
  );
}

export type ActivityInterpretation = {
  activity: Activity;
  confidence: number;
};

export function classifyActivity(
  pose: PoseLandmarkerResult,
  hands: HandLandmarkerResult,
  interaction: boolean,
  previousPelvis: Point | null,
  currentPelvis: Point | null,
  deltaTimeMs: number,
): ActivityInterpretation {
  const landmarks =
    pose.landmarks?.[0];

  if (!landmarks) {
    return {
      activity: "NO SUBJECT",
      confidence: 0,
    };
  }

  /*
   * Interaction always has priority.
   */
  if (interaction) {
    return {
      activity: "INTERACTION",
      confidence: 0.94,
    };
  }

  const leftShoulder =
    point(landmarks[11]);

  const rightShoulder =
    point(landmarks[12]);

  const leftHip =
    point(landmarks[23]);

  const rightHip =
    point(landmarks[24]);

  const leftWrist =
    point(landmarks[15]);

  const rightWrist =
    point(landmarks[16]);

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {
    return {
      activity: "STANDING",
      confidence: 0.68,
    };
  }

  const shoulderMid =
    midpoint(
      leftShoulder,
      rightShoulder,
    );

  const hipMid =
    midpoint(
      leftHip,
      rightHip,
    );

  const torsoScale =
    Math.max(
      distance(
        shoulderMid,
        hipMid,
      ),
      0.08,
    );

  /*
   * REACHING
   *
   * Use pose arm extension rather than global
   * body movement. This keeps the mission signal
   * separate from walking.
   */
  const leftReach =
    leftWrist &&
    visible(landmarks[15])
      ? distance(
          leftWrist,
          leftShoulder,
        ) /
        torsoScale
      : 0;

  const rightReach =
    rightWrist &&
    visible(landmarks[16])
      ? distance(
          rightWrist,
          rightShoulder,
        ) /
        torsoScale
      : 0;

  const lateralReach =
    Math.max(
      leftWrist
        ? Math.abs(
            leftWrist.x -
              leftShoulder.x,
          )
        : 0,
      rightWrist
        ? Math.abs(
            rightWrist.x -
              rightShoulder.x,
          )
        : 0,
    );

  if (
    hands.landmarks.length > 0 &&
    (
      leftReach > 1.55 ||
      rightReach > 1.55 ||
      lateralReach > 0.22
    )
  ) {
    return {
      activity: "REACHING",
      confidence: 0.88,
    };
  }

  /*
   * WALKING
   *
   * Deliberately conservative. A stationary
   * operator should never be labelled WALKING
   * because of normal pose jitter.
   */
  if (
    previousPelvis &&
    currentPelvis &&
    deltaTimeMs >= 120
  ) {
    const displacement =
      distance(
        previousPelvis,
        currentPelvis,
      );

    const seconds =
      deltaTimeMs / 1000;

    const normalizedSpeed =
      displacement /
      torsoScale /
      seconds;

    if (
      normalizedSpeed > 2.25 &&
      displacement > 0.045
    ) {
      return {
        activity: "WALKING",
        confidence: 0.78,
      };
    }
  }

  /*
   * SITTING
   *
   * Conservative heuristic based on knee/hip
   * geometry. It is secondary to the mission.
   */
  const leftKnee =
    point(landmarks[25]);

  const rightKnee =
    point(landmarks[26]);

  if (
    leftKnee &&
    rightKnee &&
    (
      leftKnee.y < leftHip.y ||
      rightKnee.y < rightHip.y
    )
  ) {
    return {
      activity: "SITTING",
      confidence: 0.66,
    };
  }

  /*
   * Default state for a detected but non-active
   * operator is STANDING / STABLE.
   */
  return {
    activity: "STANDING",
    confidence: 0.9,
  };
}
