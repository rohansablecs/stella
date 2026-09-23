"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { ReplayAnalyzer } from "@/lib/vision/replayAnalyzer"

import type {
  ReplayEvent,
  ReplayFrame,
} from "@/lib/vision/replayTypes"

type Props = {
  videoSrc: string
  title: string
}

const ANALYSIS_INTERVAL = 100

export default function ReplayAI({
  videoSrc,
  title,
}: Props) {
  const videoRef =
    useRef<HTMLVideoElement>(null)

  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  const analyzerRef =
    useRef<ReplayAnalyzer | null>(null)

  const frameRef =
    useRef<ReplayFrame | null>(null)

  const animationRef =
    useRef<number | null>(null)

  const lastAnalysisRef =
    useRef(0)

  const eventCounterRef =
    useRef(0)

  const lastActivityRef =
    useRef<string | null>(null)

  const [ready, setReady] =
    useState(false)

  const [analyzing, setAnalyzing] =
    useState(false)

  const [frame, setFrame] =
    useState<ReplayFrame | null>(null)

  const [events, setEvents] =
    useState<ReplayEvent[]>([])

  const [error, setError] =
    useState<string | null>(null)

  const addEvent = useCallback(
    (
      nextFrame: ReplayFrame,
    ) => {
      const activity =
        nextFrame.activity

      if (
        activity ===
        lastActivityRef.current
      ) {
        return
      }

      lastActivityRef.current =
        activity

      eventCounterRef.current += 1

      const event: ReplayEvent = {
        id: `event-${eventCounterRef.current}`,

        time: nextFrame.time,

        activity,

        confidence:
          nextFrame.confidence,

        message:
          getActivityMessage(
            activity,
          ),
      }

      setEvents((previous) => [
        ...previous,
        event,
      ])
    },
    [],
  )

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      video: HTMLVideoElement,
      result: ReplayFrame | null,
    ) => {
      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return
      }

      canvas.width =
        video.videoWidth

      canvas.height =
        video.videoHeight

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      if (!result) return

      drawPose(
        ctx,
        canvas,
        result,
      )

      drawHands(
        ctx,
        canvas,
        result,
      )

      drawObjects(
        ctx,
        canvas,
        result,
      )

      drawInteraction(
        ctx,
        canvas,
        result,
      )

      drawStatus(
        ctx,
        canvas,
        result,
      )
    },
    [],
  )

  const renderLoop = useCallback(
    (now: number) => {
      const video =
        videoRef.current

      const canvas =
        canvasRef.current

      const analyzer =
        analyzerRef.current

      if (!video || !canvas) {
        return
      }

      const ctx =
        canvas.getContext("2d")

      if (!ctx) return

      if (
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        if (
          analyzer &&
          now - lastAnalysisRef.current >=
            ANALYSIS_INTERVAL
        ) {
          lastAnalysisRef.current =
            now

          try {
            const result =
              analyzer.analyze(
                video,
                video.currentTime *
                  1000,
              )

            frameRef.current =
              result

            setFrame(result)

            addEvent(result)
          } catch (analysisError) {
            console.error(
              analysisError,
            )
          }
        }

        drawFrame(
          ctx,
          canvas,
          video,
          frameRef.current,
        )
      }

      animationRef.current =
        requestAnimationFrame(
          renderLoop,
        )
    },
    [addEvent, drawFrame],
  )

  const initialize = useCallback(
    async () => {
      try {
        setError(null)

        const analyzer =
          new ReplayAnalyzer()

        await analyzer.initialize()

        analyzerRef.current =
          analyzer

        setReady(true)
      } catch (initializationError) {
        console.error(
          initializationError,
        )

        setError(
          initializationError instanceof
            Error
            ? initializationError.message
            : "STELLA replay initialization failed.",
        )
      }
    },
    [],
  )

  useEffect(() => {
    initialize()

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current,
        )
      }
    }
  }, [initialize])

  const startReplay = async () => {
    const video =
      videoRef.current

    const analyzer =
      analyzerRef.current

    if (!video || !analyzer) {
      return
    }

    analyzer.reset()

    eventCounterRef.current = 0
    lastActivityRef.current = null
    lastAnalysisRef.current = 0

    frameRef.current = null

    setFrame(null)
    setEvents([])
    setAnalyzing(true)

    video.currentTime = 0

    await video.play()

    if (!animationRef.current) {
      animationRef.current =
        requestAnimationFrame(
          renderLoop,
        )
    }
  }

  const stopReplay = () => {
    videoRef.current?.pause()

    setAnalyzing(false)
  }

  const exportEvents = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            title,
            source: videoSrc,
            generatedAt:
              new Date().toISOString(),
            events,
          },
          null,
          2,
        ),
      ],
      {
        type: "application/json",
      },
    )

    const url =
      URL.createObjectURL(blob)

    const anchor =
      document.createElement("a")

    anchor.href = url
    anchor.download =
      `${title
        .toLowerCase()
        .replace(/\s+/g, "-")}-events.json`

    anchor.click()

    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <video
        ref={videoRef}
        src={videoSrc}
        preload="metadata"
        playsInline
        muted
        className="hidden"
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#050608",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />

        {!ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            INITIALIZING STELLA VISION...
          </div>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              padding: 32,
              color: "#ff6b6b",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          disabled={!ready}
          onClick={startReplay}
        >
          ANALYZE FULL VIDEO
        </button>

        <button
          type="button"
          onClick={stopReplay}
        >
          STOP
        </button>

        <button
          type="button"
          disabled={!events.length}
          onClick={exportEvents}
        >
          EXPORT EVENTS
        </button>
      </div>

      {frame && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, 1fr)",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Metric
            label="ACTIVITY"
            value={frame.activity}
          />

          <Metric
            label="CONFIDENCE"
            value={`${Math.round(
              frame.confidence * 100,
            )}%`}
          />

          <Metric
            label="HANDS"
            value={String(
              frame.hands.length,
            )}
          />

          <Metric
            label="OBJECTS"
            value={String(
              frame.objects.length,
            )}
          />
        </div>
      )}

      <div
        style={{
          marginTop: 24,
        }}
      >
        <h3>STELLA EVENT STREAM</h3>

        {events.map((event) => (
          <div
            key={event.id}
            style={{
              display: "flex",
              gap: 16,
              padding: "8px 0",
            }}
          >
            <code>
              {formatTime(
                event.time,
              )}
            </code>

            <strong>
              {event.activity}
            </strong>

            <span>
              {event.message}
            </span>

            <span>
              {Math.round(
                event.confidence *
                  100,
              )}
              %
            </span>
          </div>
        ))}
      </div>

      {analyzing && (
        <p>
          STELLA is processing the
          video continuously.
        </p>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <small>{label}</small>
      <div>{value}</div>
    </div>
  )
}

function drawPose(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  if (!frame.pose) return

  const points =
    frame.pose.landmarks

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
  ]

  ctx.save()

  ctx.strokeStyle =
    "#b7ff3c"

  ctx.fillStyle =
    "#ffffff"

  ctx.lineWidth = 3

  for (const [a, b] of connections) {
    const first = points[a]
    const second = points[b]

    if (!first || !second) continue

    ctx.beginPath()

    ctx.moveTo(
      first.x * canvas.width,
      first.y * canvas.height,
    )

    ctx.lineTo(
      second.x * canvas.width,
      second.y * canvas.height,
    )

    ctx.stroke()
  }

  for (const point of points) {
    if (
      point.visibility !== undefined &&
      point.visibility < 0.35
    ) {
      continue
    }

    ctx.beginPath()

    ctx.arc(
      point.x * canvas.width,
      point.y * canvas.height,
      4,
      0,
      Math.PI * 2,
    )

    ctx.fill()
  }

  const x =
    frame.pose.minX *
    canvas.width

  const y =
    frame.pose.minY *
    canvas.height

  const width =
    (frame.pose.maxX -
      frame.pose.minX) *
    canvas.width

  const height =
    (frame.pose.maxY -
      frame.pose.minY) *
    canvas.height

  ctx.strokeRect(
    x,
    y,
    width,
    height,
  )

  ctx.restore()
}

function drawHands(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  ctx.save()

  ctx.fillStyle =
    "#36d9ff"

  ctx.strokeStyle =
    "#36d9ff"

  ctx.lineWidth = 2

  for (const hand of frame.hands) {
    for (const point of hand.landmarks) {
      ctx.beginPath()

      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        3,
        0,
        Math.PI * 2,
      )

      ctx.fill()
    }

    ctx.strokeRect(
      hand.minX * canvas.width,
      hand.minY * canvas.height,
      (hand.maxX -
        hand.minX) *
        canvas.width,
      (hand.maxY -
        hand.minY) *
        canvas.height,
    )
  }

  ctx.restore()
}

function drawObjects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  ctx.save()

  ctx.strokeStyle =
    "#ffd166"

  ctx.fillStyle =
    "#ffd166"

  ctx.lineWidth = 2

  for (const object of frame.objects) {
    ctx.strokeRect(
      object.x * canvas.width,
      object.y * canvas.height,
      object.width *
        canvas.width,
      object.height *
        canvas.height,
    )

    ctx.font =
      "14px monospace"

    ctx.fillText(
      `${object.label} ${Math.round(
        object.score * 100,
      )}%`,
      object.x * canvas.width,
      object.y * canvas.height -
        6,
    )
  }

  ctx.restore()
}

function drawInteraction(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  if (
    !frame.interaction ||
    !frame.hands.length ||
    !frame.objects.length
  ) {
    return
  }

  ctx.save()

  ctx.strokeStyle =
    "#ff4fd8"

  ctx.lineWidth = 4

  let closest = {
    distance: Infinity,
    hand: null as any,
    object: null as any,
  }

  for (const hand of frame.hands) {
    for (const object of frame.objects) {
      const distance =
        Math.hypot(
          hand.centerX -
            object.centerX,
          hand.centerY -
            object.centerY,
        )

      if (
        distance <
        closest.distance
      ) {
        closest = {
          distance,
          hand,
          object,
        }
      }
    }
  }

  if (
    closest.hand &&
    closest.object
  ) {
    ctx.beginPath()

    ctx.moveTo(
      closest.hand.centerX *
        canvas.width,
      closest.hand.centerY *
        canvas.height,
    )

    ctx.lineTo(
      closest.object.centerX *
        canvas.width,
      closest.object.centerY *
        canvas.height,
    )

    ctx.stroke()
  }

  ctx.restore()
}

function drawStatus(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: ReplayFrame,
) {
  ctx.save()

  const padding = 18

  ctx.fillStyle =
    "rgba(5,6,8,0.82)"

  ctx.fillRect(
    padding,
    padding,
    340,
    92,
  )

  ctx.fillStyle =
    "#ffffff"

  ctx.font =
    "bold 18px monospace"

  ctx.fillText(
    frame.activity,
    padding + 14,
    padding + 28,
  )

  ctx.font =
    "14px monospace"

  ctx.fillText(
    `CONFIDENCE ${Math.round(
      frame.confidence * 100,
    )}%`,
    padding + 14,
    padding + 52,
  )

  ctx.fillText(
    `T ${formatTime(frame.time)}`,
    padding + 14,
    padding + 76,
  )

  ctx.restore()
}

function getActivityMessage(
  activity: string,
) {
  switch (activity) {
    case "NO_PERSON":
      return "No person confidently tracked."

    case "PERSON_DETECTED":
      return "Person detected and tracked."

    case "STABLE":
      return "Pose detected with low relative motion."

    case "REACHING":
      return "Directional upper-limb movement detected."

    case "HAND_MOVEMENT":
      return "Hand movement detected."

    case "OBJECT_PROXIMITY":
      return "Hand is spatially close to a detected object."

    case "OBJECT_INTERACTION":
      return "Hand-object spatial interaction detected."

    case "WITHDRAWAL":
      return "Hand-object distance increasing."

    default:
      return "Activity state uncertain."
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(
    seconds / 60,
  )

  const remaining = Math.floor(
    seconds % 60,
  )

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(remaining).padStart(
    2,
    "0",
  )}`
}