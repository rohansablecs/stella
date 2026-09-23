import type { Point } from "./types";

export function mirrorX(
  x: number,
  width: number,
) {
  return width - x;
}

export function distance(
  a: Point,
  b: Point,
) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
  );
}

export function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export function drawCornerBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  const length = Math.min(
    20,
    width / 4,
    height / 4,
  );

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(x, y + length);
  ctx.lineTo(x, y);
  ctx.lineTo(x + length, y);

  ctx.moveTo(
    x + width - length,
    y,
  );
  ctx.lineTo(
    x + width,
    y,
  );
  ctx.lineTo(
    x + width,
    y + length,
  );

  ctx.moveTo(
    x,
    y + height - length,
  );
  ctx.lineTo(
    x,
    y + height,
  );
  ctx.lineTo(
    x + length,
    y + height,
  );

  ctx.moveTo(
    x + width - length,
    y + height,
  );
  ctx.lineTo(
    x + width,
    y + height,
  );
  ctx.lineTo(
    x + width,
    y + height - length,
  );

  ctx.stroke();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#ffffff",
  background = "rgba(5,6,8,0.9)",
) {
  ctx.font =
    "600 11px 'IBM Plex Mono', monospace";

  const paddingX = 8;
  const metrics =
    ctx.measureText(text);

  ctx.fillStyle = background;

  ctx.fillRect(
    x,
    y - 19,
    metrics.width +
      paddingX * 2,
    25,
  );

  ctx.fillStyle = color;

  ctx.fillText(
    text,
    x + paddingX,
    y - 2,
  );
}