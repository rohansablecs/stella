"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ReplayAnalyzer,
} from "@/lib/vision/replayAnalyzer";

import type {
  ReplayEvent,
  ReplayFrame,
} from "@/lib/vision/replayTypes";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onEventsChange?: (
    events: ReplayEvent[],
  ) => void;
};

const ANALYSIS_INTERVAL = 120;

export default function SimulationAnalysisLayer({
  videoRef,
  enabled,
  onEventsChange,
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const analyzerRef =
    useRef<ReplayAnalyzer | null>(
      null,
    );

  const frameRef =
    useRef<ReplayFrame | null>(
      null,
    );

  const animationRef =
    useRef<number | null>(null);

  const lastAnalysisRef =
    useRef(0);

  const lastActivityRef =
    useRef<string | null>(null);

  const eventIdRef =
    useRef(0);

  const [ready, setReady] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [events, setEvents] =
    useState<ReplayEvent[]>([]);

  /*
   * -------------------------------------------------------
   * INITIALIZE
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function initialize() {
      try {
        const analyzer =
          new ReplayAnalyzer();

        await analyzer.initialize();

        if (cancelled) {
          return;
        }

        analyzerRef.current =
          analyzer;

        setReady(true);
      } catch (err) {
        console.error(
          "STELLA replay initialization failed:",
          err,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Replay vision initialization failed.",
          );
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;

      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        );

        animationRef.current =
          null;
      }
    };
  }, [enabled]);

  /*
   * -------------------------------------------------------
   * RESET WHEN VIDEO RESTARTS
   * -------------------------------------------------------
   */

  const resetAnalysis =
    useCallback(() => {
      analyzerRef.current?.reset();

      frameRef.current = null;

      lastAnalysisRef.current = 0;

      lastActivityRef.current =
        null;

      eventIdRef.current = 0;

      setEvents([]);

      onEventsChange?.([]);
    }, [onEventsChange]);

  /*
   * -------------------------------------------------------
   * EVENT GENERATION
   * -------------------------------------------------------
   */

  const processResult =
    useCallback(
      (result: ReplayFrame) => {
        const previous =
          lastActivityRef.current;

        if (
          previous ===
          result.activity
        ) {
          return;
        }

        lastActivityRef.current =
          result.activity;

        eventIdRef.current += 1;

        const event: ReplayEvent = {
          id:
            `replay-event-${eventIdRef.current}`,

          time: result.time,

          activity:
            result.activity,

          confidence:
            result.confidence,

          message:
            getActivityMessage(
              result.activity,
            ),
        };

        setEvents(
          (current) => {
            const next = [
              ...current,
              event,
            ];

            onEventsChange?.(next);

            return next;
          },
        );
      },
      [onEventsChange],
    );

  /*
   * -------------------------------------------------------
   * DRAW CURRENT FRAME
   * -------------------------------------------------------
   */

  const draw =
    useCallback(() => {
      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const frame =
        frameRef.current;

      if (!frame) {
        return;
      }

      drawPose(
        context,
        canvas,
        frame,
      );

      drawHands(
        context,
        canvas,
        frame,
      );

      drawObjects(
        context,
        canvas,
        frame,
      );

      drawInteractions(
        context,
        canvas,
        frame,
      );

      drawStatus(
        context,
        canvas,
        frame,
      );
    }, [videoRef]);

  /*
   * -------------------------------------------------------
   * ANALYSIS LOOP
   * -------------------------------------------------------
   */

  const loop =
    useCallback(
      (timestamp: number) => {
        const video =
          videoRef.current;

        const analyzer =
          analyzerRef.current;

        if (!video) {
          return;
        }

        if (
          video.readyState >= 2
        ) {
          if (
            !video.paused &&
            !video.ended &&
            analyzer &&
            timestamp -
              lastAnalysisRef.current >=
              ANALYSIS_INTERVAL
          ) {
            lastAnalysisRef.current =
              timestamp;

            try {
              const result =
                analyzer.analyze(
                  video,
                  video.currentTime *
                    1000,
                );

              frameRef.current =
                result;

              processResult(
                result,
              );
            } catch (err) {
              console.error(
                "STELLA replay frame error:",
                err,
              );
            }
          }

          draw();
        }

        animationRef.current =
          requestAnimationFrame(
            loop,
          );
      },
      [draw, processResult, videoRef],
    );

  /*
   * -------------------------------------------------------
   * START / STOP BASED ON VIDEO
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    function handlePlay() {
      if (!ready) {
        return;
      }

      setAnalyzing(true);

      if (
        animationRef.current ===
        null
      ) {
        animationRef.current =
          requestAnimationFrame(
            loop,
          );
      }
    }

    function handlePause() {
      setAnalyzing(false);
    }

    function handleEnded() {
      setAnalyzing(false);

      draw();
    }

    function handleSeeked() {
      analyzerRef.current?.reset();

      frameRef.current = null;

      lastAnalysisRef.current =
        0;

      lastActivityRef.current =
        null;

      draw();
    }

    function handleLoadedData() {
      draw();
    }

    video.addEventListener(
      "play",
      handlePlay,
    );

    video.addEventListener(
      "pause",
      handlePause,
    );

    video.addEventListener(
      "ended",
      handleEnded,
    );

    video.addEventListener(
      "seeked",
      handleSeeked,
    );

    video.addEventListener(
      "loadeddata",
      handleLoadedData,
    );

    return () => {
      video.removeEventListener(
        "play",
        handlePlay,
      );

      video.removeEventListener(
        "pause",
        handlePause,
      );

      video.removeEventListener(
        "ended",
        handleEnded,
      );

      video.removeEventListener(
        "seeked",
        handleSeeked,
      );

      video.removeEventListener(
        "loadeddata",
        handleLoadedData,
      );
    };
  }, [
    enabled,
    ready,
    loop,
    draw,
    videoRef,
  ]);

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  if (!enabled) {
    return null;
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="simulation-ai-canvas"
      />

      <div className="simulation-ai-status">
        {!ready &&
          !error &&
          "STELLA VISION INITIALIZING"}

        {ready &&
          !analyzing &&
          "STELLA VISION READY"}

        {analyzing &&
          "STELLA VISION ANALYZING"}

        {error &&
          `VISION ERROR: ${error}`}
      </div>
    </>
  );
}

/*
 * =========================================================
 * DRAWING
 * =========================================================
 */

function drawPose(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  if (!frame.pose) {
    return;
  }

  const points =
    frame.pose.landmarks;

  const connections = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],

    [11, 23],
    [12, 24],
    [23, 24],

    [23, 25],
    [25, 27],

    [24, 26],
    [26, 28],
  ];

  context.save();

  context.strokeStyle =
    "#b7ff3c";

  context.fillStyle =
    "#ffffff";

  context.lineWidth = 3;

  for (
    const [a, b] of connections
  ) {
    const first =
      points[a];

    const second =
      points[b];

    if (
      !first ||
      !second
    ) {
      continue;
    }

    context.beginPath();

    context.moveTo(
      first.x *
        canvas.width,
      first.y *
        canvas.height,
    );

    context.lineTo(
      second.x *
        canvas.width,
      second.y *
        canvas.height,
    );

    context.stroke();
  }

  for (
    const point of points
  ) {
    if (
      point.visibility !==
        undefined &&
      point.visibility <
        0.35
    ) {
      continue;
    }

    context.beginPath();

    context.arc(
      point.x *
        canvas.width,
      point.y *
        canvas.height,
      4,
      0,
      Math.PI * 2,
    );

    context.fill();
  }

  context.strokeRect(
    frame.pose.minX *
      canvas.width,
    frame.pose.minY *
      canvas.height,
    (frame.pose.maxX -
      frame.pose.minX) *
      canvas.width,
    (frame.pose.maxY -
      frame.pose.minY) *
      canvas.height,
  );

  context.restore();
}

function drawHands(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  context.save();

  context.strokeStyle =
    "#36d9ff";

  context.fillStyle =
    "#36d9ff";

  context.lineWidth = 2;

  for (
    const hand of frame.hands
  ) {
    for (
      const point of hand.landmarks
    ) {
      context.beginPath();

      context.arc(
        point.x *
          canvas.width,
        point.y *
          canvas.height,
        3,
        0,
        Math.PI * 2,
      );

      context.fill();
    }

    context.strokeRect(
      hand.minX *
        canvas.width,
      hand.minY *
        canvas.height,
      (hand.maxX -
        hand.minX) *
        canvas.width,
      (hand.maxY -
        hand.minY) *
        canvas.height,
    );
  }

  context.restore();
}

function drawObjects(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  context.save();

  context.strokeStyle =
    "#ffd166";

  context.fillStyle =
    "#ffd166";

  context.lineWidth = 2;

  context.font =
    "14px monospace";

  for (
    const object of frame.objects
  ) {
    context.strokeRect(
      object.x *
        canvas.width,
      object.y *
        canvas.height,
      object.width *
        canvas.width,
      object.height *
        canvas.height,
    );

    context.fillText(
      `${object.label} ${Math.round(
        object.score * 100,
      )}%`,
      object.x *
        canvas.width,
      object.y *
        canvas.height -
        6,
    );
  }

  context.restore();
}

function drawInteractions(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  if (
    !frame.interaction ||
    frame.hands.length === 0 ||
    frame.objects.length === 0
  ) {
    return;
  }

  let closestDistance =
    Infinity;

  let closestHand:
    | (typeof frame.hands)[number]
    | null = null;

  let closestObject:
    | (typeof frame.objects)[number]
    | null = null;

  for (
    const hand of frame.hands
  ) {
    for (
      const object of frame.objects
    ) {
      const distance =
        Math.hypot(
          hand.centerX -
            object.centerX,
          hand.centerY -
            object.centerY,
        );

      if (
        distance <
        closestDistance
      ) {
        closestDistance =
          distance;

        closestHand =
          hand;

        closestObject =
          object;
      }
    }
  }

  if (
    !closestHand ||
    !closestObject
  ) {
    return;
  }

  context.save();

  context.strokeStyle =
    "#ff4fd8";

  context.lineWidth = 4;

  context.beginPath();

  context.moveTo(
    closestHand.centerX *
      canvas.width,
    closestHand.centerY *
      canvas.height,
  );

  context.lineTo(
    closestObject.centerX *
      canvas.width,
    closestObject.centerY *
      canvas.height,
  );

  context.stroke();

  context.restore();
}

function drawStatus(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  context.save();

  const x = 18;
  const y = 18;

  context.fillStyle =
    "rgba(5,6,8,0.84)";

  context.fillRect(
    x,
    y,
    370,
    102,
  );

  context.fillStyle =
    "#ffffff";

  context.font =
    "bold 18px monospace";

  context.fillText(
    frame.activity,
    x + 14,
    y + 28,
  );

  context.font =
    "14px monospace";

  context.fillText(
    `CONFIDENCE ${Math.round(
      frame.confidence * 100,
    )}%`,
    x + 14,
    y + 52,
  );

  context.fillText(
    `HANDS ${frame.hands.length}  OBJECTS ${frame.objects.length}`,
    x + 14,
    y + 76,
  );

  context.fillText(
    `T ${formatTime(frame.time)}`,
    x + 14,
    y + 94,
  );

  context.restore();
}

function formatTime(
  seconds: number,
) {
  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    Math.floor(seconds % 60);

  return `${String(
    minutes,
  ).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

function getActivityMessage(
  activity: string,
) {
  switch (activity) {
    case "NO_PERSON":
      return "No person confidently tracked.";

    case "PERSON_DETECTED":
      return "Person detected.";

    case "STABLE":
      return "Low relative motion.";

    case "HAND_MOVEMENT":
      return "Hand movement detected.";

    case "OBJECT_PROXIMITY":
      return "Hand approaching detected object.";

    case "OBJECT_INTERACTION":
      return "Hand-object spatial relationship detected.";

    case "REACHING":
      return "Upper-limb directional movement detected.";

    case "WITHDRAWAL":
      return "Hand-object distance increasing.";

    default:
      return "Activity uncertain.";
  }
}