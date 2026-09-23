import type {
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import {
  drawCornerBox,
  drawLabel,
  mirrorX,
} from "./geometry";

export function drawHands(
  ctx: CanvasRenderingContext2D,
  result: HandLandmarkerResult,
  width: number,
  height: number,
) {
  for (
    let handIndex = 0;
    handIndex <
    result.landmarks.length;
    handIndex++
  ) {
    const hand =
      result.landmarks[handIndex];

    if (!hand.length) {
      continue;
    }

    const xs =
      hand.map(
        (point) => point.x,
      );

    const ys =
      hand.map(
        (point) => point.y,
      );

    const minX = Math.max(
      0,
      Math.min(...xs) - 0.02,
    );

    const maxX = Math.min(
      1,
      Math.max(...xs) + 0.02,
    );

    const minY = Math.max(
      0,
      Math.min(...ys) - 0.02,
    );

    const maxY = Math.min(
      1,
      Math.max(...ys) + 0.02,
    );

    const boxWidth =
      (maxX - minX) * width;

    const boxHeight =
      (maxY - minY) * height;

    const boxX =
      width -
      minX * width -
      boxWidth;

    drawCornerBox(
      ctx,
      boxX,
      minY * height,
      boxWidth,
      boxHeight,
      "#ffffff",
    );

    drawLabel(
      ctx,
      `HAND ${handIndex + 1}`,
      boxX,
      minY * height,
      "#ffffff",
    );

    for (const point of hand) {
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

    const chains = [
      [0, 1, 2, 3, 4],
      [0, 5, 6, 7, 8],
      [0, 9, 10, 11, 12],
      [0, 13, 14, 15, 16],
      [0, 17, 18, 19, 20],
    ];

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    for (const chain of chains) {
      ctx.beginPath();

      chain.forEach(
        (index, chainIndex) => {
          const point =
            hand[index];

          if (!point) {
            return;
          }

          const x =
            mirrorX(
              point.x * width,
              width,
            );

          const y =
            point.y * height;

          if (chainIndex === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        },
      );

      ctx.stroke();
    }
  }
}