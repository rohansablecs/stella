"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FilesetResolver,
  HandLandmarker,
  ObjectDetector,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import CameraView from "./CameraView";
import ActivityPanel from "./ActivityPanel";
import SequencePanel from "./SequencePanel";
import EventLog, {
  type LiveEvent,
} from "./EventLog";

import {
  drawPose,
  getPelvis,
} from "@/lib/vision/pose";

import {
  drawHands,
} from "@/lib/vision/hands";

import {
  drawObjects,
  drawInteraction,
  extractObjects,
  findInteraction,
} from "@/lib/vision/objects";

import {
  classifyActivity,
} from "@/lib/vision/activity";

import type {
  Activity,
  Point,
} from "@/lib/vision/types";

import {
  ProcedureValidator,
} from "@/lib/experiment/validator";

import type {
  ProcedureState,
} from "@/lib/experiment/sequence";

import {
  speak,
} from "@/lib/experiment/voice";

const WASM_PATH =
  "/mediapipe-wasm";

const POSE_MODEL =
  "/models/pose_landmarker_lite.task";

const HAND_MODEL =
  "/models/hand_landmarker.task";

const OBJECT_MODEL =
  "/models/efficientdet_lite0.tflite";

const INFERENCE_INTERVAL = 75;

function createId() {
  return crypto.randomUUID();
}

function timeString() {
  return new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}

export default function LiveAI() {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const poseRef =
    useRef<PoseLandmarker | null>(
      null,
    );

  const handsRef =
    useRef<HandLandmarker | null>(
      null,
    );

  const objectsRef =
    useRef<ObjectDetector | null>(
      null,
    );

  const streamRef =
    useRef<MediaStream | null>(
      null,
    );

  const validatorRef =
    useRef(
      new ProcedureValidator(),
    );

  const pelvisRef =
    useRef<Point | null>(
      null,
    );

  const pelvisTimeRef =
    useRef<number | null>(
      null,
    );

  const previousActivityRef =
    useRef<Activity>(
      "NO SUBJECT",
    );

  const lastInferenceRef =
    useRef(0);

  /*
   * Cache the latest perception result.
   * Inference can run at ~10–20 FPS while the
   * overlay itself renders at the browser's frame rate.
   */
  const latestPerceptionRef =
    useRef<{
      pose: any;
      hands: any;
      objects: any;
      interaction: any;
      width: number;
      height: number;
    } | null>(null);

  const fpsFramesRef =
    useRef(0);

  const fpsStartRef =
    useRef(performance.now());

  const [loading, setLoading] =
    useState(true);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fps, setFps] =
    useState(0);

  const [activity, setActivity] =
    useState<Activity>(
      "NO SUBJECT",
    );

  const [confidence, setConfidence] =
    useState(0);

  const [poseDetected, setPoseDetected] =
    useState(false);

  const [handCount, setHandCount] =
    useState(0);

  const [objectCount, setObjectCount] =
    useState(0);

  const [interaction, setInteraction] =
    useState(false);

  const [procedureState, setProcedureState] =
    useState<ProcedureState>(
      "WAITING",
    );

  const [events, setEvents] =
    useState<LiveEvent[]>([]);

  const addEvent = useCallback(
    (
      kind: LiveEvent["kind"],
      message: string,
    ) => {
      setEvents((current) => [
        ...current.slice(-49),
        {
          id: createId(),
          timestamp:
            timeString(),
          kind,
          message,
        },
      ]);
    },
    [],
  );

  /*
   * --------------------------------------------------
   * MODEL INITIALIZATION
   * --------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        addEvent(
          "SYSTEM",
          "Initializing local vision runtime.",
        );

        const vision =
          await FilesetResolver.forVisionTasks(
            WASM_PATH,
          );

        if (cancelled) {
          return;
        }

        const pose =
          await PoseLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  POSE_MODEL,
                delegate: "GPU",
              },
              runningMode:
                "VIDEO",
              numPoses: 1,
              minPoseDetectionConfidence:
                0.5,
              minPosePresenceConfidence:
                0.5,
              minTrackingConfidence:
                0.5,
            },
          );

        const hands =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  HAND_MODEL,
                delegate: "GPU",
              },
              runningMode:
                "VIDEO",
              numHands: 2,
              minHandDetectionConfidence:
                0.5,
              minHandPresenceConfidence:
                0.5,
              minTrackingConfidence:
                0.5,
            },
          );

        const objects =
          await ObjectDetector.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  OBJECT_MODEL,
                delegate: "GPU",
              },
              runningMode:
                "VIDEO",
              maxResults: 5,
              scoreThreshold: 0.3,
            },
          );

        if (cancelled) {
          pose.close();
          hands.close();
          objects.close();
          return;
        }

        poseRef.current = pose;
        handsRef.current = hands;
        objectsRef.current =
          objects;

        setLoading(false);

        addEvent(
          "SYSTEM",
          "Pose, hand and object models ready.",
        );

        addEvent(
          "SYSTEM",
          "Local browser inference active.",
        );
      } catch (err) {
        console.error(err);

        setLoading(false);

        setError(
          "STELLA could not initialize the local vision runtime.",
        );

        addEvent(
          "WARNING",
          "Vision runtime initialization failed.",
        );
      }
    }

    initialize();

    return () => {
      cancelled = true;

      poseRef.current?.close();
      handsRef.current?.close();
      objectsRef.current?.close();
    };
  }, [addEvent]);

  /*
   * --------------------------------------------------
   * INFERENCE LOOP
   * --------------------------------------------------
   *
   * This is deliberately an effect driven by `running`.
   * No self-referencing useCallback dependency.
   */

  useEffect(() => {
    if (!running) {
      return;
    }

    let animationFrame =
      0;

    const processFrame = (
      time: number,
    ) => {
      const video =
        videoRef.current;

      if (
        !video ||
        video.readyState <
          HTMLMediaElement.HAVE_CURRENT_DATA ||
        !poseRef.current ||
        !handsRef.current ||
        !objectsRef.current
      ) {
        animationFrame =
          requestAnimationFrame(
            processFrame,
          );

        return;
      }

      if (
        time -
          lastInferenceRef.current <
        INFERENCE_INTERVAL
      ) {
        animationFrame =
          requestAnimationFrame(
            processFrame,
          );

        return;
      }

      lastInferenceRef.current =
        time;

      try {
        const width =
          video.videoWidth || 1280;

        const height =
          video.videoHeight || 720;

        const pose =
          poseRef.current.detectForVideo(
            video,
            time,
          );

        const hands =
          handsRef.current.detectForVideo(
            video,
            time,
          );

        const objects =
          objectsRef.current.detectForVideo(
            video,
            time,
          );

        const canvas =
          canvasRef.current;

        if (!canvas) {
          animationFrame =
            requestAnimationFrame(
              processFrame,
            );

          return;
        }

        if (
          canvas.width !== width ||
          canvas.height !== height
        ) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          return;
        }

        ctx.clearRect(
          0,
          0,
          width,
          height,
        );

        const trackedObjects =
          extractObjects(
            objects,
            width,
            height,
          );

        const interactionState =
          findInteraction(
            hands,
            trackedObjects,
          );

        const landmarks =
          pose.landmarks?.[0];

        const currentPelvis =
          landmarks
            ? getPelvis(
                landmarks,
              )
            : null;

        const previousPelvis =
          pelvisRef.current;

        const previousTime =
          pelvisTimeRef.current;

        const deltaTime =
          previousTime === null
            ? 0
            : time -
              previousTime;

        const interpretation =
          classifyActivity(
            pose,
            hands,
            interactionState.active,
            previousPelvis,
            currentPelvis,
            deltaTime,
          );

        if (currentPelvis) {
          pelvisRef.current =
            currentPelvis;

          pelvisTimeRef.current =
            time;
        }

        /*
         * -----------------------------
         * CACHE PERCEPTION
         * -----------------------------
         *
         * MediaPipe inference is expensive.
         * Keep its newest result and render that
         * result continuously below the inference
         * path.
         */

        latestPerceptionRef.current = {
          pose,
          hands,
          objects: trackedObjects,
          interaction: interactionState,
          width,
          height,
        };

        /*
         * -----------------------------
         * UPDATE UI STATE
         * -----------------------------
         */

        setPoseDetected(
          Boolean(
            pose.landmarks?.length,
          ),
        );

        setHandCount(
          hands.landmarks.length,
        );

        setObjectCount(
          trackedObjects.length,
        );

        setActivity(
          interpretation.activity,
        );

        setConfidence(
          interpretation.confidence,
        );

        setInteraction(
          interactionState.active,
        );

        /*
         * -----------------------------
         * ACTIVITY EVENTS
         * -----------------------------
         */

        if (
          interpretation.activity !==
          previousActivityRef.current
        ) {
          if (
            interpretation.activity !==
            "NO SUBJECT"
          ) {
            addEvent(
              "DETECTED",
              `Activity: ${interpretation.activity}`,
            );
          }

          previousActivityRef.current =
            interpretation.activity;
        }

        /*
         * -----------------------------
         * EXPERIMENT VALIDATION
         * -----------------------------
         */

        const validation =
          validatorRef.current.update(
            {
              now: time,
              poseDetected:
                Boolean(
                  pose.landmarks
                    ?.length,
                ),
              activity:
                interpretation.activity,
              interaction:
                interactionState.active,
            },
          );

        setProcedureState(
          validation.state,
        );

        if (
          validation.kind &&
          validation.message
        ) {
          addEvent(
            validation.kind,
            validation.message,
          );
        }

        if (validation.voice) {
          speak(
            validation.voice,
          );
        }

        /*
         * -----------------------------
         * FPS
         * -----------------------------
         */

        fpsFramesRef.current += 1;

        if (
          time -
            fpsStartRef.current >=
          1000
        ) {
          setFps(
            fpsFramesRef.current,
          );

          fpsFramesRef.current = 0;
          fpsStartRef.current =
            time;
        }
        /*
         * -----------------------------
         * CONTINUOUS RENDER
         * -----------------------------
         *
         * Inference is deliberately slower than
         * the browser render loop. Draw the newest
         * cached perception result every frame.
         */

        const latest =
          latestPerceptionRef.current;

        if (latest) {
          ctx.clearRect(
            0,
            0,
            latest.width,
            latest.height,
          );

          drawObjects(
            ctx,
            latest.objects,
            latest.width,
            latest.height,
          );

          drawPose(
            ctx,
            latest.pose,
            latest.width,
            latest.height,
          );

          drawHands(
            ctx,
            latest.hands,
            latest.width,
            latest.height,
          );

          drawInteraction(
            ctx,
            latest.interaction,
            latest.width,
            latest.height,
          );
        }

      } catch (frameError) {
        console.error(
          "STELLA frame error:",
          frameError,
        );
      }

      animationFrame =
        requestAnimationFrame(
          processFrame,
        );
    };

    animationFrame =
      requestAnimationFrame(
        processFrame,
      );

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [running, addEvent]);

  /*
   * --------------------------------------------------
   * CAMERA
   * --------------------------------------------------
   */

  const startCamera =
    useCallback(async () => {
      try {
        setError("");

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
                facingMode: "user",
              },
              audio: false,
            },
          );

        const video =
          videoRef.current;

        if (!video) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop(),
            );

          return;
        }

        streamRef.current =
          stream;

        video.srcObject =
          stream;

        video.muted = true;
        video.playsInline = true;

        await video.play();

        validatorRef.current.reset();

        pelvisRef.current = null;
        pelvisTimeRef.current =
          null;

        previousActivityRef.current =
          "NO SUBJECT";

        setProcedureState(
          "WAITING",
        );

        setRunning(true);

        addEvent(
          "SYSTEM",
          "Camera connected. Local perception active.",
        );
      } catch (err) {
        console.error(err);

        setError(
          "Camera access was denied or unavailable.",
        );

        addEvent(
          "WARNING",
          "Camera connection failed.",
        );
      }
    }, [addEvent]);

  const stopCamera =
    useCallback(() => {
      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop(),
        );

      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject =
          null;
      }

      setRunning(false);

      latestPerceptionRef.current = null;

      validatorRef.current.reset();

      setProcedureState(
        "WAITING",
      );

      setInteraction(false);

      addEvent(
        "SYSTEM",
        "Camera feed stopped.",
      );
    }, [addEvent]);

  const resetSession =
    useCallback(() => {
      validatorRef.current.reset();

      pelvisRef.current = null;
      pelvisTimeRef.current =
        null;

      previousActivityRef.current =
        "NO SUBJECT";

      setProcedureState(
        "WAITING",
      );

      setActivity(
        "NO SUBJECT",
      );

      setConfidence(0);

      setEvents([
        {
          id: createId(),
          timestamp:
            timeString(),
          kind: "SYSTEM",
          message:
            "STELLA session reset.",
        },
      ]);
    }, []);

  const exportSession =
    useCallback(() => {
      const payload = {
        system: "STELLA",
        problemStatement:
          "SIH26174",
        module:
          "LIVE_BROWSER_AI",
        runtime:
          "LOCAL_BROWSER_INFERENCE",
        generatedAt:
          new Date().toISOString(),
        procedure: {
          state:
            procedureState,
        },
        perception: {
          poseDetected,
          handCount,
          objectCount,
          activity,
          confidence,
          interaction,
        },
        events,
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2,
            ),
          ],
          {
            type:
              "application/json",
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const anchor =
        document.createElement(
          "a",
        );

      anchor.href = url;

      anchor.download =
        `stella-session-${Date.now()}.json`;

      anchor.click();

      URL.revokeObjectURL(
        url,
      );

      addEvent(
        "SYSTEM",
        "Structured session log exported.",
      );
    }, [
      activity,
      confidence,
      events,
      handCount,
      interaction,
      objectCount,
      poseDetected,
      procedureState,
      addEvent,
    ]);

  return (
    <main className="live-page">
      <header className="live-topbar">
        <a
          href="/"
          className="live-brand"
        >
          <span className="live-brand-mark">
            S
          </span>

          <span>
            STELLA
          </span>
        </a>

        <div className="live-topbar-meta">
          <span>
            SIH26174
          </span>

          <span className="topbar-divider" />

          <span>
            LOCAL AI / LIVE PERCEPTION
          </span>

          <span
            className={
              running
                ? "system-indicator active"
                : "system-indicator"
            }
          />
        </div>
      </header>

      <section className="live-shell">
        <div className="live-heading">
          <div>
            <div className="live-eyebrow">
              01 / LIVE AI
            </div>

            <h1>
              Human activity
              <br />
              <span>
                in context.
              </span>
            </h1>

            <p>
              STELLA combines pose,
              hands, scene objects and
              temporal state to demonstrate
              autonomous experiment
              assistance at the edge.
            </p>
          </div>

          <div className="runtime-card">
            <span className="runtime-label">
              RUNTIME
            </span>

            <strong>
              {running
                ? "LOCAL / ACTIVE"
                : loading
                  ? "INITIALIZING"
                  : "READY"}
            </strong>

            <small>
              Camera inference remains
              inside this browser session.
            </small>
          </div>
        </div>

        {error && (
          <div className="live-error">
            <strong>
              VISION RUNTIME
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

        <div className="live-workspace">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            running={running}
            loading={loading}
            fps={fps}
            onStart={
              startCamera
            }
          />

          <aside className="analysis-column">
            <ActivityPanel
              activity={activity}
              confidence={
                confidence
              }
            />

            <SequencePanel
              state={
                procedureState
              }
            />

            <section className="analysis-card">
              <div className="analysis-label">
                PERCEPTION STACK
              </div>

              <div className="stack-row">
                <span>
                  POSE LANDMARKER
                </span>

                <b
                  className={
                    poseDetected
                      ? "ok"
                      : ""
                  }
                >
                  {poseDetected
                    ? "ACTIVE"
                    : "WAITING"}
                </b>
              </div>

              <div className="stack-row">
                <span>
                  HAND LANDMARKER
                </span>

                <b
                  className={
                    handCount
                      ? "ok"
                      : ""
                  }
                >
                  {handCount
                    ? `${handCount} TRACKED`
                    : "WAITING"}
                </b>
              </div>

              <div className="stack-row">
                <span>
                  OBJECT DETECTOR
                </span>

                <b
                  className={
                    objectCount
                      ? "ok"
                      : ""
                  }
                >
                  {objectCount
                    ? `${objectCount} FOUND`
                    : "SEARCHING"}
                </b>
              </div>

              <div className="stack-row">
                <span>
                  TEMPORAL STATE
                </span>

                <b className="ok">
                  ACTIVE
                </b>
              </div>
            </section>

            <section className="analysis-card guidance-card">
              <div className="analysis-label">
                STELLA GUIDANCE
              </div>

              <div className="guidance-state">
                {procedureState ===
                "COMPLETE"
                  ? "SEQUENCE VALID"
                  : procedureState ===
                      "INTERACT"
                    ? "MAINTAIN ACTION"
                    : procedureState ===
                        "REACH"
                      ? "REACH TARGET"
                      : "AWAITING ACTION"}
              </div>

              <p>
                {procedureState ===
                "COMPLETE"
                  ? "Procedure sequence validated and recorded."
                  : procedureState ===
                      "INTERACT"
                    ? "Maintain the hand-to-object relationship."
                    : procedureState ===
                        "REACH"
                      ? "Reach toward a detected object."
                      : "STELLA is evaluating the operator and scene."}
              </p>
            </section>

            <div className="control-grid">
              {running ? (
                <button
                  className="control-button stop"
                  onClick={
                    stopCamera
                  }
                >
                  STOP CAMERA
                </button>
              ) : (
                <button
                  className="control-button start"
                  onClick={
                    startCamera
                  }
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "INITIALIZING"
                    : "START CAMERA"}
                </button>
              )}

              <button
                className="control-button"
                onClick={
                  resetSession
                }
              >
                RESET SESSION
              </button>

              <button
                className="control-button full"
                onClick={
                  exportSession
                }
              >
                EXPORT STRUCTURED SESSION LOG
              </button>
            </div>
          </aside>
        </div>

        <div className="perception-strip">
          <div>
            <span>
              PERSON
            </span>

            <strong>
              {poseDetected
                ? "TRACKING"
                : "SEARCHING"}
            </strong>
          </div>

          <div>
            <span>
              HANDS
            </span>

            <strong>
              {handCount}
            </strong>
          </div>

          <div>
            <span>
              OBJECTS
            </span>

            <strong>
              {objectCount}
            </strong>
          </div>

          <div>
            <span>
              INTERACTION
            </span>

            <strong
              className={
                interaction
                  ? "highlight"
                  : ""
              }
            >
              {interaction
                ? "DETECTED"
                : "NONE"}
            </strong>
          </div>
        </div>

        <EventLog
          events={events}
        />
      </section>
    </main>
  );
}