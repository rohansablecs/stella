"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ReplayFile,
  ReplayHand,
  ReplayObject,
  ReplayPoint,
} from "@/lib/vision/replayTypes";

import type {
  Simulation,
} from "@/lib/simulations";

type Props = {
  simulation: Simulation;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}


function getReplayAction(
  analysis: ReplayPoint,
) {
  if (analysis.action) {
    return analysis.action;
  }

  /*
   * Backwards compatibility for replay.json v1.
   */
  switch (analysis.activity) {
    case "REACHING":
      return "REACH";

    case "OBJECT_INTERACTION":
      return "GRASP";

    case "HAND_MOVEMENT":
      return "MOVE";

    case "WITHDRAWAL":
      return "WITHDRAW";

    case "PERSON_DETECTED":
      return "OPERATOR_DETECTED";

    case "NO_PERSON":
      return "WAITING";

    default:
      return "UNKNOWN";
  }
}

function displayAction(
  analysis: ReplayPoint,
) {
  return getReplayAction(
    analysis,
  ).replace(
    /_/g,
    " ",
  );
}

function lerp(
  a: number,
  b: number,
  amount: number,
) {
  return a + (b - a) * amount;
}

function interpolateHand(
  left: ReplayHand,
  right: ReplayHand,
  amount: number,
): ReplayHand {
  return {
    ...left,

    x: lerp(left.x, right.x, amount),
    y: lerp(left.y, right.y, amount),

    centerX: lerp(
      left.centerX,
      right.centerX,
      amount,
    ),

    centerY: lerp(
      left.centerY,
      right.centerY,
      amount,
    ),

    minX: lerp(
      left.minX,
      right.minX,
      amount,
    ),

    minY: lerp(
      left.minY,
      right.minY,
      amount,
    ),

    maxX: lerp(
      left.maxX,
      right.maxX,
      amount,
    ),

    maxY: lerp(
      left.maxY,
      right.maxY,
      amount,
    ),

    landmarks: left.landmarks.map(
      (landmark, index) => {
        const next =
          right.landmarks[index];

        if (!next) {
          return landmark;
        }

        return {
          x: lerp(
            landmark.x,
            next.x,
            amount,
          ),

          y: lerp(
            landmark.y,
            next.y,
            amount,
          ),

          z: lerp(
            landmark.z,
            next.z,
            amount,
          ),

          ...(landmark.visibility !== undefined ||
          next.visibility !== undefined
            ? {
                visibility: lerp(
                  landmark.visibility ?? 0,
                  next.visibility ?? 0,
                  amount,
                ),
              }
            : {}),
        };
      },
    ),
  };
}

function interpolateObject(
  left: ReplayObject,
  right: ReplayObject,
  amount: number,
): ReplayObject {
  const x = lerp(
    left.x,
    right.x,
    amount,
  );

  const y = lerp(
    left.y,
    right.y,
    amount,
  );

  const width = lerp(
    left.width,
    right.width,
    amount,
  );

  const height = lerp(
    left.height,
    right.height,
    amount,
  );

  return {
    ...left,

    score: lerp(
      left.score,
      right.score,
      amount,
    ),

    x,
    y,
    width,
    height,

    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

function interpolateReplay(
  replay: ReplayPoint[],
  time: number,
): ReplayPoint | null {
  if (!replay.length) {
    return null;
  }

  if (time <= replay[0].time) {
    return replay[0];
  }

  const last =
    replay[replay.length - 1];

  if (time >= last.time) {
    return last;
  }

  let left = replay[0];
  let right = replay[1];

  for (
    let i = 0;
    i < replay.length - 1;
    i++
  ) {
    const current = replay[i];
    const next = replay[i + 1];

    if (
      current.time <= time &&
      next.time >= time
    ) {
      left = current;
      right = next;
      break;
    }
  }

  const range =
    right.time - left.time;

  const amount =
    range <= 0
      ? 0
      : Math.min(
          1,
          Math.max(
            0,
            (time - left.time) / range,
          ),
        );

  const person =
    left.person &&
    right.person
      ? {
          x: lerp(
            left.person.x,
            right.person.x,
            amount,
          ),

          y: lerp(
            left.person.y,
            right.person.y,
            amount,
          ),

          width: lerp(
            left.person.width,
            right.person.width,
            amount,
          ),

          height: lerp(
            left.person.height,
            right.person.height,
            amount,
          ),
        }
      : left.person ?? right.person;

  /*
   * Hands are matched by detector index.
   * The full landmark/bounding-box data is preserved.
   */
  const hands: ReplayHand[] =
    left.hands.map(
      (hand, index) => {
        const next =
          right.hands[index];

        if (!next) {
          return hand;
        }

        return interpolateHand(
          hand,
          next,
          amount,
        );
      },
    );

  /*
   * Objects are matched by stable replay id
   * whenever possible, falling back to index.
   */
  const objects: ReplayObject[] =
    left.objects.map(
      (object, index) => {
        const next =
          right.objects.find(
            (candidate) =>
              candidate.id === object.id,
          ) ??
          right.objects[index];

        if (!next) {
          return object;
        }

        return interpolateObject(
          object,
          next,
          amount,
        );
      },
    );

  /*
   * Interaction indices belong to the current
   * interpolated arrays, so retain the semantic
   * state from the left frame.
   */
  return {
    ...left,

    time,

    person,
    hands,
    objects,

    interaction: {
      ...left.interaction,
    },

    step: {
      ...left.step,
    },
  };
}

export default function SimulationViewer({
  simulation,
}: Props) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const [replay, setReplay] =
    useState<ReplayFile | null>(
      null,
    );

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [videoError, setVideoError] =
    useState(false);

  const [replayError, setReplayError] =
    useState(false);

  /*
   * Load cached replay JSON once.
   *
   * No MediaPipe.
   * No model.
   * No inference.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadReplay() {
      setReplayError(false);
      setReplay(null);

      try {
        const response =
          await fetch(
            simulation.replay,
            {
              cache: "force-cache",
            },
          );

        if (!response.ok) {
          throw new Error(
            `Replay unavailable: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as ReplayFile;

        if (
          !data ||
          !Array.isArray(data.frames)
        ) {
          throw new Error(
            "Invalid replay file.",
          );
        }

        if (!cancelled) {
          setReplay(data);
        }
      } catch (error) {
        console.error(
          "STELLA replay load failed:",
          error,
        );

        if (!cancelled) {
          setReplayError(true);
        }
      }
    }

    loadReplay();

    return () => {
      cancelled = true;
    };
  }, [simulation.replay]);

  const analysis =
    useMemo(
      () =>
        interpolateReplay(
          replay?.frames ?? [],
          currentTime,
        ),
      [
        replay,
        currentTime,
      ],
    );

  function seek(seconds: number) {
    if (!videoRef.current) {
      return;
    }

    const target = Math.max(
      0,
      Math.min(
        seconds,
        duration || seconds,
      ),
    );

    videoRef.current.currentTime =
      target;

    setCurrentTime(target);
  }

  return (
    <div className="simulation-viewer">
      <div
        className="simulation-video-shell"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        {!videoError ? (
          <video
            ref={videoRef}
            src={simulation.video}
            controls
            playsInline
            preload="metadata"
            style={{
              display: "block",
              width: "100%",
            }}
            onLoadedMetadata={(event) => {
              setDuration(
                event.currentTarget.duration,
              );
            }}
            onTimeUpdate={(event) => {
              setCurrentTime(
                event.currentTarget.currentTime,
              );
            }}
            onSeeked={(event) => {
              setCurrentTime(
                event.currentTarget.currentTime,
              );
            }}
            onError={() => {
              setVideoError(true);
            }}
          />
        ) : (
          <div className="simulation-missing">
            <span>
              VIDEO SOURCE UNAVAILABLE
            </span>

            <strong>
              {simulation.video}
            </strong>
          </div>
        )}

        {analysis && (
          <ReplayHUD
            analysis={analysis}
            currentTime={currentTime}
          />
        )}

        {!analysis &&
          !replayError && (
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                padding: "10px 13px",
                background:
                  "rgba(5,8,6,.88)",
                color: "#b7ff3c",
                fontFamily:
                  "IBM Plex Mono, monospace",
                fontSize: 10,
                letterSpacing: ".12em",
                zIndex: 10,
              }}
            >
              LOADING CACHED ANALYSIS
            </div>
          )}

        {replayError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "rgba(5,6,8,.88)",
              zIndex: 20,
              fontFamily:
                "IBM Plex Mono, monospace",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <strong>
                REPLAY DATA NOT FOUND
              </strong>

              <p>
                Generate the cached
                replay JSON using
                /simulations/precompute.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="simulation-analysis">
        <section>
          <div className="analysis-label">
            CURRENT ACTION
          </div>

          <h3>
            {analysis?.action?.replace(
              /_/g,
              " ",
            ) ??
              "Awaiting analysis"}
          </h3>

          <span className="simulation-event-type valid">
            {analysis
              ? `${(analysis.actionConfidence ?? analysis.confidence) ?? analysis.confidence}% CONFIDENCE`
              : "—"}
          </span>
        </section>

        <section>
          <div className="analysis-label">
          </div>

          <strong>
            {" / "}
          </strong>

          <p>
          </p>

          <small>
          </small>
        </section>

        <section>
          <div className="analysis-label">
            DETECTION EVIDENCE
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
            }}
          >
            {(analysis?.evidence ?? []).map(
              (item) => (
                <span
                  key={item}
                  style={{
                    padding:
                      "4px 7px",
                    border:
                      "1px solid rgba(183,255,60,.28)",
                    color:
                      "#b7ff3c",
                    fontSize: 8,
                    letterSpacing:
                      ".06em",
                  }}
                >
                  {item.replace(
                    /_/g,
                    " ",
                  )}
                </span>
              ),
            )}
          </div>
        </section>

        <section>
          <div className="analysis-label">
            PERCEPTION
          </div>

          <p>
            {analysis?.interaction?.label ??
              "No active hand-object interaction"}
          </p>

          <small>
            {analysis
              ? `${analysis.hands.length} hand(s) · ${analysis.objects.length} object(s)`
              : ""}
          </small>
        </section>
      </div>

      <div className="simulation-timeline">
        <div className="timeline-header">
          <span>
            PRECOMPUTED EVENT TIMELINE
          </span>

          <span>
            {formatTime(currentTime)}
            {" / "}
            {duration
              ? formatTime(duration)
              : "--:--"}
          </span>
        </div>

        <div className="timeline-track">
          {(replay?.events ??
            simulation.events).map(
            (event, index) => (
              <button
                key={`${simulation.id}-event-${index}`}
                type="button"
                className={`timeline-event ${
                  event.time <= currentTime
                    ? "passed"
                    : ""
                }`}
                style={{
                  left: `${
                    duration
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (event.time /
                              duration) *
                              100,
                          ),
                        )
                      : 0
                  }%`,
                }}
                onClick={() =>
                  seek(event.time)
                }
                title={
                  "message" in event
                    ? event.message
                    : event.label
                }
              />
            ),
          )}
        </div>

        <div className="timeline-list">
          {(replay?.events ??
            simulation.events).map(
            (event, index) => (
              <button
                key={`${simulation.id}-row-${index}`}
                type="button"
                className={
                  event.time <= currentTime
                    ? "timeline-row active"
                    : "timeline-row"
                }
                onClick={() =>
                  seek(event.time)
                }
              >
                <time>
                  {formatTime(event.time)}
                </time>

                <span
                  className={`event-kind ${
                    "action" in event &&
                    event.action
                      ? event.action.toLowerCase()
                      : "type" in event
                        ? event.type.toLowerCase()
                        : "event"
                  }`}
                >
                  {"action" in event &&
                  event.action
                    ? event.action
                    : "type" in event
                      ? event.type
                      : "EVENT"}
                </span>

                <strong>
                  {"message" in event
                    ? event.message
                    : event.label}
                </strong>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="simulation-capabilities">
        {simulation.capabilities.map(
          (capability, index) => (
            <span
              key={`${simulation.id}-capability-${index}`}
            >
              {capability}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function ReplayHUD({
  analysis,
  currentTime,
}: {
  analysis: ReplayPoint;
  currentTime: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        fontFamily:
          "IBM Plex Mono, monospace",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          padding: "10px 13px",
          background:
            "rgba(5,8,6,.86)",
          border:
            "1px solid rgba(183,255,60,.65)",
        }}
      >
        <div
          style={{
            color: "#b7ff3c",
            fontSize: 10,
            letterSpacing: ".18em",
            marginBottom: 8,
          }}
        >
          STELLA / REPLAY
        </div>

        <div
          style={{
            fontSize: 9,
            color: "#b7ff3c",
          }}
        >
          ● CACHED ANALYSIS
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 230,
          padding: 14,
          background:
            "rgba(5,8,6,.9)",
          border:
            "1px solid rgba(255,255,255,.2)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#8f9690",
            letterSpacing: ".15em",
            marginBottom: 7,
          }}
        >
          CURRENT ACTION
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {displayAction(analysis)}
        </div>

        <div
          style={{
            height: 3,
            background:
              "rgba(255,255,255,.12)",
          }}
        >
          <div
            style={{
              width: `${(analysis.actionConfidence ?? analysis.confidence) ?? analysis.confidence}%`,
              height: "100%",
              background: "#b7ff3c",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: 9,
            color: "#9da49e",
          }}
        >
          ACTION CONFIDENCE{" "}
          {(analysis.actionConfidence ?? analysis.confidence) ?? analysis.confidence}%
        </div>
      </div>

      {analysis.person && (
        <div
          style={{
            position: "absolute",
            left: `${analysis.person.x * 100}%`,
            top: `${analysis.person.y * 100}%`,
            width: `${analysis.person.width * 100}%`,
            height: `${analysis.person.height * 100}%`,
            border:
              "2px solid #b7ff3c",
            boxShadow:
              "0 0 18px rgba(183,255,60,.2)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -23,
              left: -2,
              padding: "4px 7px",
              background: "#b7ff3c",
              color: "#050608",
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            PERSON
          </div>
        </div>
      )}

      {analysis.objects.map(
        (object) => (
          <div
            key={object.id}
            style={{
              position: "absolute",
              left: `${object.x * 100}%`,
              top: `${object.y * 100}%`,
              width: `${object.width * 100}%`,
              height: `${object.height * 100}%`,
              border:
                "2px solid #fff",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                left: 0,
                background: "#fff",
                color: "#050608",
                padding: "3px 6px",
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              {object.label}
            </div>
          </div>
        ),
      )}

      {analysis.hands.map(
        (hand, index) => (
          <div
            key={`${hand.handedness}-${index}`}
            style={{
              position: "absolute",
              left: `${hand.x * 100}%`,
              top: `${hand.y * 100}%`,
              width: 13,
              height: 13,
              transform:
                "translate(-50%, -50%)",
              border:
                "2px solid #fff",
              borderRadius: "50%",
              background:
                "#b7ff3c",
              boxShadow:
                "0 0 12px rgba(183,255,60,.8)",
            }}
          />
        ),
      )}

      {analysis.interaction.active &&
        analysis.interaction.handIndex !==
          null &&
        analysis.interaction.objectIndex !==
          null &&
        analysis.hands[
          analysis.interaction.handIndex
        ] &&
        analysis.objects[
          analysis.interaction.objectIndex
        ] && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <line
              x1={`${
                analysis.hands[
                  analysis.interaction
                    .handIndex
                ].x * 100
              }%`}
              y1={`${
                analysis.hands[
                  analysis.interaction
                    .handIndex
                ].y * 100
              }%`}
              x2={`${
                analysis.objects[
                  analysis.interaction
                    .objectIndex
                ].centerX * 100
              }%`}
              y2={`${
                analysis.objects[
                  analysis.interaction
                    .objectIndex
                ].centerY * 100
              }%`}
              stroke="#b7ff3c"
              strokeWidth="2"
              strokeDasharray="7 5"
            />
          </svg>
        )}

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 55,
          padding: "9px 12px",
          background:
            "rgba(5,8,6,.9)",
          border:
            "1px solid rgba(183,255,60,.5)",
          color: "#b7ff3c",
          fontSize: 10,
        }}
      >
        ●{" "}
        {displayAction(analysis)}{" — "}
        {analysis.interaction.label ||
          "NO ACTIVE INTERACTION"}
      </div>

      <div
        style={{
          position: "absolute",
          right: 18,
          bottom: 55,
          padding: "10px 13px",
          background:
            "rgba(5,8,6,.9)",
          border:
            "1px solid rgba(255,255,255,.22)",
        }}
      ><strong
          style={{
            color: "#b7ff3c",
            fontSize: 15,
          }}
        >
          {" / "}
          {" — "}
        </strong>
      </div>

      <div
        style={{
          position: "absolute",
          right: 18,
          top: 88,
          padding: "5px 8px",
          background:
            "rgba(5,8,6,.8)",
          color: "#b7ff3c",
          fontSize: 10,
        }}
      >
        {formatTime(currentTime)}
      </div>
    </div>
  );
}
