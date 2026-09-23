"use client";

import {
  FilesetResolver,
  HandLandmarker,
  ObjectDetector,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import type {
  ReplayActivity,
  ReplayAction,
  ReplayEvidence,
  ReplayHand,
  ReplayInteraction,
  ReplayMission,
  ReplayObject,
  ReplayPerson,
  ReplayPoint,
  ReplayStep,
  ReplayEvent,
} from "./replayTypes";

const WASM_PATH = "/mediapipe-wasm";

const POSE_MODEL =
  "/models/pose_landmarker_lite.task";

const HAND_MODEL =
  "/models/hand_landmarker.task";

const OBJECT_MODEL =
  "/models/efficientdet_lite0.tflite";

type PreviousState = {
  person: ReplayPerson | null;
  hands: ReplayHand[];
  objects: ReplayObject[];
};

type AnalyzerModels = {
  pose: PoseLandmarker;
  hands: HandLandmarker;
  objects: ObjectDetector;
};

export class ReplayAnalyzer {
  private models: AnalyzerModels | null = null;

  private previous: PreviousState = {
    person: null,
    hands: [],
    objects: [],
  };

  private mission: ReplayMission =
    "SAMPLE_HANDLING";

  private action: ReplayAction =
    "WAITING";

  private interactionStarted:
    number | null = null;

  private interactionLostAt:
    number | null = null;

  private movementStarted:
    number | null = null;

  private lastEventAction:
    ReplayAction = "WAITING";

  private events: ReplayEvent[] = [];

  async initialize() {
    if (this.models) {
      return;
    }

    const vision =
      await FilesetResolver.forVisionTasks(
        WASM_PATH,
      );

    const [
      pose,
      hands,
      objects,
    ] = await Promise.all([
      PoseLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              POSE_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        },
      ),

      HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              HAND_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.25,
          minHandPresenceConfidence: 0.25,
          minTrackingConfidence: 0.25,
        },
      ),

      ObjectDetector.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              OBJECT_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          scoreThreshold: 0.25,
          maxResults: 10,
        },
      ),
    ]);

    this.models = {
      pose,
      hands,
      objects,
    };
  }

  reset(
    mission: ReplayMission =
      "SAMPLE_HANDLING",
  ) {
    this.mission = mission;

    this.previous = {
      person: null,
      hands: [],
      objects: [],
    };

    this.action = "WAITING";
    this.interactionStarted = null;
    this.interactionLostAt = null;
    this.movementStarted = null;
    this.lastEventAction = "WAITING";
    this.events = [];
  }

  getEvents() {
    return this.events;
  }

  analyze(
    video: HTMLVideoElement,
    timestampMs: number,
    timeSeconds: number =
      video.currentTime,
  ): ReplayPoint {
    if (!this.models) {
      throw new Error(
        "ReplayAnalyzer has not been initialized.",
      );
    }

    const width =
      video.videoWidth;

    const height =
      video.videoHeight;

    if (!width || !height) {
      return this.emptyFrame(
        timeSeconds,
      );
    }

    const poseResult =
      this.models.pose.detectForVideo(
        video,
        timestampMs,
      );

    const handResult =
      this.models.hands.detectForVideo(
        video,
        timestampMs,
      );

    const objectResult =
      this.models.objects.detectForVideo(
        video,
        timestampMs,
      );

    const person =
      this.buildPerson(
        poseResult,
      );

    const hands =
      this.buildHands(
        handResult,
      );

    const objects =
      this.buildObjects(
        objectResult,
        width,
        height,
      );

    const motion =
      this.calculateMotion(
        person,
        hands,
        objects,
      );

    const interaction =
      this.findInteraction(
        hands,
        objects,
      );

    const activity =
      this.classifyActivity(
        person,
        hands,
        objects,
        interaction,
        motion,
      );

    const perceptionConfidence =
      this.calculateConfidence(
        person,
        hands,
        objects,
      );

    const semantic =
      this.classifyAction(
        timeSeconds,
        person,
        hands,
        objects,
        interaction,
        motion,
        activity,
      );

    const frame: ReplayPoint = {
      time: timeSeconds,

      activity,

      confidence:
        perceptionConfidence,

      action:
        semantic.action,

      actionConfidence:
        semantic.confidence,

      mission:
        this.mission,

      evidence:
        semantic.evidence,

      person,

      hands,

      objects,

      interaction,

      step:
        semantic.step,

      motion,
    };

    this.previous = {
      person,
      hands,
      objects,
    };

    return frame;
  }

  private buildPerson(
    result: any,
  ): ReplayPerson | null {
    const landmarks =
      result?.landmarks?.[0];

    if (
      !landmarks ||
      landmarks.length === 0
    ) {
      return null;
    }

    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;

    for (
      const point of landmarks
    ) {
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

    return {
      x: Math.max(
        0,
        minX,
      ),

      y: Math.max(
        0,
        minY,
      ),

      width:
        Math.min(1, maxX) -
        Math.max(0, minX),

      height:
        Math.min(1, maxY) -
        Math.max(0, minY),
    };
  }

  private buildHands(
    result: any,
  ): ReplayHand[] {
    const landmarks =
      result?.landmarks ?? [];

    const handedness =
      result?.handedness ?? [];

    return landmarks.map(
      (
        hand: any[],
        index: number,
      ) => {
        let minX = 1;
        let minY = 1;
        let maxX = 0;
        let maxY = 0;

        const normalized =
          hand.map(
            (point: any) => ({
              x: point.x,
              y: point.y,
              z: point.z ?? 0,
            }),
          );

        for (
          const point of normalized
        ) {
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

        const centerX =
          (minX + maxX) / 2;

        const centerY =
          (minY + maxY) / 2;

        const label =
          handedness[index]?.[0]
            ?.categoryName ??
          "Unknown";

        return {
          x: centerX,
          y: centerY,

          handedness:
            label,

          landmarks:
            normalized,

          centerX,
          centerY,

          minX,
          minY,
          maxX,
          maxY,
        };
      },
    );
  }

  private buildObjects(
    result: any,
    videoWidth: number,
    videoHeight: number,
  ): ReplayObject[] {
    const detections =
      result?.detections ?? [];

    const objects:
      ReplayObject[] = [];

    detections.forEach(
      (
        detection: any,
        index: number,
      ) => {
        const category =
          detection?.categories?.[0];

        const box =
          detection?.boundingBox;

        if (!category || !box) {
          return;
        }

        const label =
          String(
            category.categoryName ??
              "object",
          );

        if (
          label.toLowerCase() ===
          "person"
        ) {
          return;
        }

        const score =
          Number(
            category.score ?? 0,
          );

        if (score < 0.25) {
          return;
        }

        const x =
          box.originX /
          videoWidth;

        const y =
          box.originY /
          videoHeight;

        const width =
          box.width /
          videoWidth;

        const height =
          box.height /
          videoHeight;

        objects.push({
          id:
            `object-${index}`,

          label,

          score,

          x,
          y,
          width,
          height,

          centerX:
            x + width / 2,

          centerY:
            y + height / 2,
        });
      },
    );

    return objects;
  }

  private calculateMotion(
    person: ReplayPerson | null,
    hands: ReplayHand[],
    objects: ReplayObject[],
  ): number {
    let total = 0;
    let count = 0;

    if (
      person &&
      this.previous.person
    ) {
      total += this.distance(
        person.x,
        person.y,
        this.previous.person.x,
        this.previous.person.y,
      );

      total += this.distance(
        person.width,
        person.height,
        this.previous.person.width,
        this.previous.person.height,
      );

      count += 2;
    }

    const handCount =
      Math.min(
        hands.length,
        this.previous.hands.length,
      );

    for (
      let i = 0;
      i < handCount;
      i++
    ) {
      total += this.distance(
        hands[i].x,
        hands[i].y,
        this.previous.hands[i].x,
        this.previous.hands[i].y,
      );

      count++;
    }

    const objectCount =
      Math.min(
        objects.length,
        this.previous.objects.length,
      );

    for (
      let i = 0;
      i < objectCount;
      i++
    ) {
      total += this.distance(
        objects[i].centerX,
        objects[i].centerY,
        this.previous.objects[i].centerX,
        this.previous.objects[i].centerY,
      );

      count++;
    }

    if (!count) {
      return 0;
    }

    return Math.min(
      1,
      total / count,
    );
  }

  /*
   * Robust interaction:
   * hand landmarks → object box,
   * rather than hand-center → object-center.
   */
  private findInteraction(
    hands: ReplayHand[],
    objects: ReplayObject[],
  ): ReplayInteraction {
    let bestDistance =
      Infinity;

    let bestHand = -1;
    let bestObject = -1;

    hands.forEach(
      (
        hand,
        handIndex,
      ) => {
        const points = [
          ...hand.landmarks,
          {
            x: hand.x,
            y: hand.y,
            z: 0,
          },
        ];

        objects.forEach(
          (
            object,
            objectIndex,
          ) => {
            const tolerance =
              Math.max(
                0.045,
                Math.min(
                  0.11,
                  Math.max(
                    object.width,
                    object.height,
                  ) *
                    0.35 +
                    0.025,
                ),
              );

            let closest =
              Infinity;

            for (
              const point of points
            ) {
              const distance =
                this.pointToBoxDistance(
                  point.x,
                  point.y,
                  object,
                );

              closest =
                Math.min(
                  closest,
                  distance,
                );
            }

            if (
              closest <
              bestDistance
            ) {
              bestDistance =
                closest;

              bestHand =
                handIndex;

              bestObject =
                objectIndex;
            }

            if (
              closest <= tolerance &&
              closest <
                bestDistance
            ) {
              bestDistance =
                closest;

              bestHand =
                handIndex;

              bestObject =
                objectIndex;
            }
          },
        );
      },
    );

    if (
      bestHand < 0 ||
      bestObject < 0
    ) {
      return {
        active: false,
        handIndex: null,
        objectIndex: null,
        label: "",
      };
    }

    const object =
      objects[bestObject];

    const active =
      bestDistance <=
      Math.max(
        0.045,
        Math.min(
          0.11,
          Math.max(
            object.width,
            object.height,
          ) *
            0.35 +
            0.025,
        ),
      );

    return {
      active,

      handIndex:
        bestHand,

      objectIndex:
        bestObject,

      distance:
        bestDistance,

      label: active
        ? `INTERACTING WITH ${object.label.toUpperCase()}`
        : bestDistance < 0.18
          ? `APPROACHING ${object.label.toUpperCase()}`
          : "",
    };
  }

  private pointToBoxDistance(
    px: number,
    py: number,
    object: ReplayObject,
  ) {
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
      dx * dx + dy * dy,
    );
  }

  private classifyActivity(
    person: ReplayPerson | null,
    hands: ReplayHand[],
    objects: ReplayObject[],
    interaction: ReplayInteraction,
    motion: number,
  ): ReplayActivity {
    if (!person) {
      return "NO_PERSON";
    }

    if (
      interaction.active
    ) {
      return "OBJECT_INTERACTION";
    }

    if (
      interaction.label.startsWith(
        "APPROACHING",
      )
    ) {
      return "OBJECT_PROXIMITY";
    }

    if (
      motion > 0.045 &&
      hands.length > 0
    ) {
      return "HAND_MOVEMENT";
    }

    if (
      motion > 0.018
    ) {
      return "REACHING";
    }

    if (
      objects.length > 0
    ) {
      return "STABLE";
    }

    return "PERSON_DETECTED";
  }

  /*
   * This is the important layer.
   *
   * We turn raw perception into a temporal
   * experiment action.
   */
  private classifyAction(
    time: number,
    person: ReplayPerson | null,
    hands: ReplayHand[],
    objects: ReplayObject[],
    interaction: ReplayInteraction,
    motion: number,
    activity: ReplayActivity,
  ): {
    action: ReplayAction;
    confidence: number;
    evidence: ReplayEvidence[];
    step: ReplayStep;
  } {
    if (!person) {
      this.action = "WAITING";
      this.interactionStarted = null;
      this.movementStarted = null;

      return {
        action: "WAITING",
        confidence: 0,
        evidence: [],
        step: this.getStep(
          "WAITING",
        ),
      };
    }

    const evidence:
      ReplayEvidence[] = [
        "PERSON_DETECTED",
      ];

    if (hands.length > 0) {
      evidence.push(
        "HAND_DETECTED",
      );
    }

    if (objects.length > 0) {
      evidence.push(
        "TARGET_DETECTED",
      );
    }

    /*
     * First detection.
     */
    if (
      this.action ===
      "WAITING"
    ) {
      this.action =
        "OPERATOR_DETECTED";
    }

    /*
     * Interaction begins.
     */
    if (interaction.active) {
      if (
        this.interactionStarted ===
        null
      ) {
        this.interactionStarted =
          time;
      }

      this.interactionLostAt =
        null;

      if (
        interaction.distance !==
          undefined &&
        interaction.distance <
          0.13
      ) {
        evidence.push(
          "HAND_APPROACHING_TARGET",
        );
      }

      evidence.push(
        "HAND_OBJECT_CONTACT",
      );

      const duration =
        time -
        this.interactionStarted;

      if (
        duration >= 0.35
      ) {
        evidence.push(
          "SUSTAINED_INTERACTION",
        );

        if (
          this.action ===
            "REACH" ||
          this.action ===
            "OPERATOR_DETECTED"
        ) {
          this.action =
            "GRASP";
        } else if (
          this.action ===
            "GRASP" ||
          this.action ===
            "MOVE"
        ) {
          if (
            motion >
            0.025
          ) {
            this.action =
              "MOVE";

            if (
              this.movementStarted ===
              null
            ) {
              this.movementStarted =
                time;
            }

            evidence.push(
              "OBJECT_MOVEMENT",
            );
          }
        }
      }
    } else {
      if (
        this.interactionStarted !==
        null
      ) {
        if (
          this.interactionLostAt ===
          null
        ) {
          this.interactionLostAt =
            time;
        }
      }

      /*
       * Hand is approaching a target.
       */
      if (
        activity ===
          "OBJECT_PROXIMITY" ||
        activity ===
          "REACHING"
      ) {
        evidence.push(
          "HAND_APPROACHING_TARGET",
        );

        if (
          this.action ===
          "OPERATOR_DETECTED"
        ) {
          this.action =
            "REACH";
        }
      }

      /*
       * Interaction ended after manipulation.
       */
      if (
        this.action ===
          "GRASP" ||
        this.action ===
          "MOVE"
      ) {
        if (
          this.interactionLostAt !==
            null &&
          time -
            this.interactionLostAt >=
            0.45
        ) {
          this.action =
            "PLACE";

          evidence.push(
            "INTERACTION_RELEASED",
          );
        }
      }

      /*
       * After release, movement away from
       * the target becomes withdrawal.
       */
      if (
        this.action ===
          "PLACE" &&
        motion >
          0.018
      ) {
        this.action =
          "WITHDRAW";

        evidence.push(
          "OPERATOR_WITHDRAWAL",
        );
      }
    }

    /*
     * Keep a stable operator-detected state
     * instead of pretending every static frame
     * is an action.
     */
    if (
      this.action ===
        "OPERATOR_DETECTED" &&
      activity ===
        "STABLE"
    ) {
      this.action =
        "OPERATOR_DETECTED";
    }

    const step =
      this.getStep(
        this.action,
      );

    const confidence =
      this.actionConfidence(
        this.action,
        evidence,
        activity,
      );

    this.emitActionEvent(
      time,
      this.action,
      confidence,
      step,
      evidence,
    );

    return {
      action:
        this.action,

      confidence,

      evidence,

      step,
    };
  }

  private actionConfidence(
    action: ReplayAction,
    evidence: ReplayEvidence[],
    activity: ReplayActivity,
  ) {
    if (
      false
    ) {
      return 0;
    }

    let confidence = 68;

    confidence +=
      evidence.includes(
        "PERSON_DETECTED",
      )
        ? 8
        : 0;

    confidence +=
      evidence.includes(
        "HAND_DETECTED",
      )
        ? 6
        : 0;

    confidence +=
      evidence.includes(
        "TARGET_DETECTED",
      )
        ? 5
        : 0;

    confidence +=
      evidence.includes(
        "HAND_OBJECT_CONTACT",
      )
        ? 7
        : 0;

    confidence +=
      evidence.includes(
        "SUSTAINED_INTERACTION",
      )
        ? 6
        : 0;

    confidence +=
      activity ===
      "OBJECT_INTERACTION"
        ? 5
        : 0;

    return Math.min(
      98,
      confidence,
    );
  }

  private getStep(
    action: ReplayAction,
  ): ReplayStep {
    const profiles: Record<
      ReplayMission,
      ReplayStep[]
    > = {
      SAMPLE_HANDLING: [
        {
          current: 1,
          total: 6,
          id: "ready",
          label: "READY POSITION",
          description:
            "Operator establishes the experiment position.",
          status:
            action ===
            "WAITING"
              ? "CURRENT"
              : "COMPLETE",
        },
        {
          current: 2,
          total: 6,
          id: "reach",
          label: "REACH FOR SAMPLE",
          description:
            "Operator reaches toward the sample.",
          status:
            action ===
            "REACH"
              ? "CURRENT"
              : action ===
                    "WAITING" ||
                  action ===
                    "OPERATOR_DETECTED"
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 3,
          total: 6,
          id: "grasp",
          label: "GRASP SAMPLE",
          description:
            "Hand-object contact is sustained.",
          status:
            action ===
            "GRASP"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 4,
          total: 6,
          id: "move",
          label: "MOVE SAMPLE",
          description:
            "Sample is manipulated while retained.",
          status:
            action ===
            "MOVE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 5,
          total: 6,
          id: "place",
          label: "PLACE SAMPLE",
          description:
            "Object interaction ends at the placement phase.",
          status:
            action ===
            "PLACE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                    "MOVE",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 6,
          total: 6,
          id: "withdraw",
          label: "WITHDRAW",
          description:
            "Operator withdraws from the work area.",
          status:
            action ===
            "WITHDRAW" ||
            action ===
            "COMPLETE"
              ? "CURRENT"
              : "PENDING",
        },
      ],

      SAMPLE_TRANSFER: [
        {
          current: 1,
          total: 6,
          id: "ready",
          label: "READY POSITION",
          description:
            "Operator establishes the transfer position.",
          status:
            action ===
            "WAITING"
              ? "CURRENT"
              : "COMPLETE",
        },
        {
          current: 2,
          total: 6,
          id: "reach-source",
          label: "REACH SOURCE",
          description:
            "Operator reaches toward the source sample.",
          status:
            action ===
            "REACH"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 3,
          total: 6,
          id: "grasp",
          label: "GRASP SAMPLE",
          description:
            "Source sample is acquired.",
          status:
            action ===
            "GRASP"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 4,
          total: 6,
          id: "transfer",
          label: "TRANSFER SAMPLE",
          description:
            "Sample is moved toward the destination.",
          status:
            action ===
            "MOVE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 5,
          total: 6,
          id: "place",
          label: "PLACE AT TARGET",
          description:
            "Sample is released at the destination.",
          status:
            action ===
            "PLACE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                    "MOVE",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 6,
          total: 6,
          id: "withdraw",
          label: "WITHDRAW",
          description:
            "Operator withdraws from the transfer area.",
          status:
            action ===
              "WITHDRAW" ||
            action ===
              "COMPLETE"
              ? "CURRENT"
              : "PENDING",
        },
      ],

      TOOL_HANDLING: [
        {
          current: 1,
          total: 6,
          id: "ready",
          label: "READY POSITION",
          description:
            "Operator establishes the tool-handling position.",
          status:
            action ===
            "WAITING"
              ? "CURRENT"
              : "COMPLETE",
        },
        {
          current: 2,
          total: 6,
          id: "reach-tool",
          label: "REACH FOR TOOL",
          description:
            "Operator reaches toward the tool.",
          status:
            action ===
            "REACH"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 3,
          total: 6,
          id: "grasp-tool",
          label: "GRASP TOOL",
          description:
            "Tool contact is sustained.",
          status:
            action ===
            "GRASP"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 4,
          total: 6,
          id: "move-tool",
          label: "MOVE TO WORK AREA",
          description:
            "Tool is manipulated toward the work area.",
          status:
            action ===
            "MOVE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 5,
          total: 6,
          id: "return-tool",
          label: "RETURN TOOL",
          description:
            "Tool is released at the designated area.",
          status:
            action ===
            "PLACE"
              ? "CURRENT"
              : [
                    "WAITING",
                    "OPERATOR_DETECTED",
                    "REACH",
                    "GRASP",
                    "MOVE",
                  ].includes(
                    action,
                  )
                ? "PENDING"
                : "COMPLETE",
        },
        {
          current: 6,
          total: 6,
          id: "withdraw",
          label: "WITHDRAW",
          description:
            "Operator exits the work area.",
          status:
            action ===
              "WITHDRAW" ||
            action ===
              "COMPLETE"
              ? "CURRENT"
              : "PENDING",
        },
      ],
    };

    const steps =
      profiles[this.mission];

    return (
      steps.find(
        (step) =>
          step.status ===
          "CURRENT",
      ) ??
      steps[0]
    );
  }

  private emitActionEvent(
    time: number,
    action: ReplayAction,
    confidence: number,
    step: ReplayStep,
    evidence: ReplayEvidence[],
  ) {
    if (
      action ===
        this.lastEventAction ||
      false
    ) {
      return;
    }

    this.lastEventAction =
      action;

    const messages:
      Partial<
        Record<
          ReplayAction,
          string
        >
      > = {
        OPERATOR_DETECTED:
          "Operator presence detected.",
        REACH:
          "Reach toward target detected.",
        GRASP:
          "Sustained hand-object grasp detected.",
        MOVE:
          "Object manipulation / transfer detected.",
        PLACE:
          "Object release detected.",
        WITHDRAW:
          "Operator withdrawal detected.",
        COMPLETE:
          "Experiment sequence complete.",
      };

    const legacyActivity: ReplayActivity =
      false
        ? "NO_PERSON"
        : action === "OPERATOR_DETECTED"
          ? "PERSON_DETECTED"
          : action === "REACH"
            ? "REACHING"
            : action === "GRASP"
              ? "OBJECT_INTERACTION"
              : action === "MOVE"
                ? "HAND_MOVEMENT"
                : action === "PLACE"
                  ? "OBJECT_INTERACTION"
                  : action === "WITHDRAW"
                    ? "WITHDRAWAL"
                    : "UNKNOWN";

    this.events.push({
      id:
        `event-${this.events.length + 1}`,

      time,

      activity:
        legacyActivity,

      action,

      step,

      confidence,

      message:
        messages[action] ??
        "Experiment action detected.",

      evidence,
    });
  }

  private calculateConfidence(
    person: ReplayPerson | null,
    hands: ReplayHand[],
    objects: ReplayObject[],
  ): number {
    if (!person) {
      return 0;
    }

    let confidence = 76;

    if (hands.length > 0) {
      confidence += 8;
    }

    if (objects.length > 0) {
      confidence += 6;
    }

    return Math.min(
      96,
      confidence,
    );
  }

  private emptyFrame(
    time: number,
  ): ReplayPoint {
    return {
      time,

      activity:
        "NO_PERSON",

      confidence: 0,

      action:
        "WAITING",

      actionConfidence: 0,

      mission:
        this.mission,

      evidence: [],

      person: null,

      hands: [],

      objects: [],

      interaction: {
        active: false,
        handIndex: null,
        objectIndex: null,
        label: "",
      },

      step:
        this.getStep(
          "WAITING",
        ),

      motion: 0,
    };
  }

  private distance(
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ) {
    return Math.sqrt(
      (ax - bx) ** 2 +
      (ay - by) ** 2,
    );
  }
}

export function missionForSimulation(
  simulationId: string,
): ReplayMission {
  const id =
    simulationId.toLowerCase();

  if (
    id.includes("apollo")
  ) {
    return "SAMPLE_TRANSFER";
  }

  if (
    id.includes("lunaris")
  ) {
    return "TOOL_HANDLING";
  }

  return "SAMPLE_HANDLING";
}
