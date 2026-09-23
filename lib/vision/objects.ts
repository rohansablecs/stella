import type {
  ObjectDetectorResult,
} from "@mediapipe/tasks-vision";

import {
  distance,
  drawCornerBox,
  drawLabel,
  mirrorX,
} from "./geometry";

import type {
  Interaction,
  TrackedObject,
} from "./types";

export function extractObjects(
  result: ObjectDetectorResult,
  width: number,
  height: number,
): TrackedObject[] {
  return result.detections
    .map(
      (detection, index) => {
        const box =
          detection.boundingBox;

        const category =
          detection.categories?.[0];

        if (
          !box ||
          !category
        ) {
          return null;
        }

        const score =
          category.score ?? 0;

        const label = (
          category.categoryName ??
          "OBJECT"
        ).toLowerCase();

        if (score < 0.3) {
          return null;
        }

        if (
          label === "person" ||
          label === "people"
        ) {
          return null;
        }

        const x =
          box.originX / width;

        const y =
          box.originY / height;

        const objectWidth =
          box.width / width;

        const objectHeight =
          box.height / height;

        return {
          id: index,
          label:
            category.categoryName ??
            "OBJECT",
          score,
          x,
          y,
          width: objectWidth,
          height: objectHeight,
          centerX:
            x + objectWidth / 2,
          centerY:
            y + objectHeight / 2,
        };
      },
    )
    .filter(
      (
        object,
      ): object is TrackedObject =>
        object !== null,
    );
}

export function drawObjects(
  ctx: CanvasRenderingContext2D,
  objects: TrackedObject[],
  width: number,
  height: number,
) {
  for (const object of objects) {
    const boxWidth =
      object.width * width;

    const boxHeight =
      object.height * height;

    const x =
      width -
      object.x * width -
      boxWidth;

    const y =
      object.y * height;

    drawCornerBox(
      ctx,
      x,
      y,
      boxWidth,
      boxHeight,
      "#55d8ff",
    );

    drawLabel(
      ctx,
      `${object.label.toUpperCase()} ${(
        object.score * 100
      ).toFixed(0)}%`,
      x,
      y,
      "#55d8ff",
      "rgba(3,14,19,0.92)",
    );
  }
}

export function findInteraction(
  hands: {
    landmarks: {
      x: number;
      y: number;
    }[][];
  },
  objects: TrackedObject[],
): Interaction {
  let closest: Interaction = {
    active: false,
    object: null,
    hand: null,
    distance: Infinity,
  };

  /*
   * Do not rely on wrist → object-center distance.
   *
   * During an actual grasp the wrist can be considerably
   * farther from the object than the fingertips/palm.
   *
   * Instead:
   *  1. inspect the complete hand landmark set
   *  2. measure distance to the object's bounding box
   *  3. add a small adaptive tolerance around the box
   *
   * This makes interaction robust across different object
   * sizes and camera positions.
   */

  const clamp = (
    value: number,
    min: number,
    max: number,
  ) =>
    Math.max(
      min,
      Math.min(max, value),
    );

  const pointToBoxDistance = (
    px: number,
    py: number,
    object: TrackedObject,
  ) => {
    const left = object.x;
    const right =
      object.x + object.width;

    const top = object.y;
    const bottom =
      object.y + object.height;

    const dx =
      px < left
        ? left - px
        : px > right
          ? px - right
          : 0;

    const dy =
      py < top
        ? top - py
        : py > bottom
          ? py - bottom
          : 0;

    return Math.sqrt(
      dx * dx +
      dy * dy,
    );
  };

  for (const hand of hands.landmarks) {
    if (!hand?.length) {
      continue;
    }

    /*
     * Prefer fingertips + wrist, but keep every landmark
     * available so the interaction envelope follows the hand.
     */
    const candidates = [
      hand[0],  // wrist
      hand[4],  // thumb tip
      hand[8],  // index tip
      hand[12], // middle tip
      hand[16], // ring tip
      hand[20], // pinky tip
      ...hand,
    ].filter(
      (
        point,
      ): point is {
        x: number;
        y: number;
      } =>
        Boolean(point) &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y),
    );

    for (const object of objects) {
      /*
       * Adaptive tolerance:
       * larger objects naturally get a slightly larger
       * interaction envelope, while small objects remain
       * reasonably precise.
       */
      const objectSize =
        Math.max(
          object.width,
          object.height,
        );

      const tolerance = clamp(
        objectSize * 0.35 + 0.025,
        0.05,
        0.12,
      );

      let bestDistance = Infinity;
      let bestPoint:
        | {
            x: number;
            y: number;
          }
        | null = null;

      for (const point of candidates) {
        const boxDistance =
          pointToBoxDistance(
            point.x,
            point.y,
            object,
          );

        if (
          boxDistance <
          bestDistance
        ) {
          bestDistance =
            boxDistance;

          bestPoint = point;
        }
      }

      /*
       * Also calculate center distance for ranking.
       * This prevents a strange edge case where two objects
       * are close together and the farther interaction wins.
       */
      const centerDistance =
        bestPoint
          ? distance(
              bestPoint,
              {
                x: object.centerX,
                y: object.centerY,
              },
            )
          : Infinity;

      const interactionDistance =
        bestDistance;

      if (
        interactionDistance <
        closest.distance
      ) {
        closest = {
          active:
            interactionDistance <=
            tolerance,
          object,
          hand: bestPoint,
          distance:
            interactionDistance,
        };
      }

      /*
       * If the hand is actually inside the object box,
       * treat it as an unambiguous interaction regardless
       * of object size.
       */
      if (
        bestPoint &&
        bestPoint.x >= object.x &&
        bestPoint.x <=
          object.x + object.width &&
        bestPoint.y >= object.y &&
        bestPoint.y <=
          object.y + object.height
      ) {
        if (
          centerDistance <
          closest.distance ||
          !closest.active
        ) {
          closest = {
            active: true,
            object,
            hand: bestPoint,
            distance:
              interactionDistance,
          };
        }
      }
    }
  }

  return closest;
}

export function drawInteraction(
  ctx: CanvasRenderingContext2D,
  interaction: Interaction,
  width: number,
  height: number,
) {
  if (
    !interaction.active ||
    !interaction.hand ||
    !interaction.object
  ) {
    return;
  }

  const handX =
    mirrorX(
      interaction.hand.x *
        width,
      width,
    );

  const handY =
    interaction.hand.y *
    height;

  const objectX =
    mirrorX(
      interaction.object.centerX *
        width,
      width,
    );

  const objectY =
    interaction.object.centerY *
    height;

  ctx.beginPath();

  ctx.moveTo(
    handX,
    handY,
  );

  ctx.lineTo(
    objectX,
    objectY,
  );

  ctx.strokeStyle =
    "#ffcf5c";

  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();

  ctx.arc(
    objectX,
    objectY,
    24,
    0,
    Math.PI * 2,
  );

  ctx.strokeStyle =
    "#ffcf5c";

  ctx.lineWidth = 2;
  ctx.stroke();

  drawLabel(
    ctx,
    "INTERACTION",
    objectX + 28,
    objectY,
    "#ffcf5c",
    "rgba(27,20,5,0.94)",
  );
}