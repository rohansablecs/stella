import type {
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

import {
  drawCornerBox,
  drawLabel,
  mirrorX,
} from "./geometry";

import type { Point } from "./types";

export const POSE_CONNECTIONS: [
  number,
  number,
][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
];

export function getPersonBounds(
  landmarks: NonNullable<
    PoseLandmarkerResult["landmarks"]
  >[number],
) {
  if (!landmarks.length) {
    return null;
  }

  const visible =
    landmarks.filter(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y),
    );

  if (!visible.length) {
    return null;
  }

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const point of visible) {
    minX = Math.min(
      minX,
      point.x,
    );

    minY = Math.min(
      minY,
      point.y,
    );

    maxX = Math.max(
      maxX,
      point.x,
    );

    maxY = Math.max(
      maxY,
      point.y,
    );
  }

  const paddingX = 0.035;
  const paddingY = 0.045;

  minX = Math.max(
    0,
    minX - paddingX,
  );

  minY = Math.max(
    0,
    minY - paddingY,
  );

  maxX = Math.min(
    1,
    maxX + paddingX,
  );

  maxY = Math.min(
    1,
    maxY + paddingY,
  );

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getPelvis(
  landmarks: NonNullable<
    PoseLandmarkerResult["landmarks"]
  >[number],
): Point | null {
  const left = landmarks[23];
  const right = landmarks[24];

  if (!left || !right) {
    return null;
  }

  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

export function drawPose(
  ctx: CanvasRenderingContext2D,
  result: PoseLandmarkerResult,
  width: number,
  height: number,
) {
  const landmarks =
    result.landmarks?.[0];

  if (!landmarks) {
    return;
  }

  const bounds =
    getPersonBounds(landmarks);

  if (bounds) {
    const boxWidth =
      bounds.width * width;

    const boxHeight =
      bounds.height * height;

    const boxX =
      width -
      bounds.x * width -
      boxWidth;

    const boxY =
      bounds.y * height;

    drawCornerBox(
      ctx,
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      "#b7ff3c",
    );

    drawLabel(
      ctx,
      "PERSON / TRACKING",
      boxX,
      boxY,
      "#b7ff3c",
    );
  }

  ctx.strokeStyle =
    "rgba(183,255,60,0.9)";
  ctx.lineWidth = 2.5;

  for (const [a, b] of POSE_CONNECTIONS) {
    const start = landmarks[a];
    const end = landmarks[b];

    if (!start || !end) {
      continue;
    }

    ctx.beginPath();

    ctx.moveTo(
      mirrorX(
        start.x * width,
        width,
      ),
      start.y * height,
    );

    ctx.lineTo(
      mirrorX(
        end.x * width,
        width,
      ),
      end.y * height,
    );

    ctx.stroke();
  }

  for (const point of landmarks) {
    ctx.beginPath();

    ctx.arc(
      mirrorX(
        point.x * width,
        width,
      ),
      point.y * height,
      3.5,
      0,
      Math.PI * 2,
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
}