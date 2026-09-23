"use client";

import { useRef, useState } from "react";

import { ReplayAnalyzer } from "@/lib/vision/replayAnalyzer";

import type {
  ReplayFile,
} from "@/lib/vision/replayTypes";

import {
  missionForSimulation,
} from "@/lib/vision/replayAnalyzer";

const VIDEOS = [
  {
    id: "orbit-demo",
    name: "ORBIT",
    src: "/simulations/orbit/source.mp4",
  },
  {
    id: "apollo-demo",
    name: "APOLLO",
    src: "/simulations/apollo/source.mp4",
  },
  {
    id: "lunaris-demo",
    name: "LUNARIS",
    src: "/simulations/lunaris/source.mp4",
  },
];

export default function PrecomputePage() {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const [selected, setSelected] =
    useState(VIDEOS[0]);

  const [status, setStatus] =
    useState("READY");

  const [progress, setProgress] =
    useState(0);

  const [frameCount, setFrameCount] =
    useState(0);

  const [error, setError] =
    useState("");

  async function generateReplay() {
    setError("");
    setProgress(0);
    setFrameCount(0);
    setStatus("LOADING VIDEO");

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const analyzer =
      new ReplayAnalyzer();

    try {
      await waitForVideo(video);

      setStatus("LOADING MODELS");

      await analyzer.initialize();

      const mission =
        missionForSimulation(
          selected.id,
        );

      analyzer.reset(
        mission,
      );

      const duration =
        video.duration;

      const sampleInterval = 0.20;

      const frames = [];

      const totalFrames =
        Math.ceil(
          duration /
            sampleInterval,
        );

      for (
        let index = 0;
        index < totalFrames;
        index++
      ) {
        const time =
          Math.min(
            index *
              sampleInterval,
            Math.max(
              duration -
                0.01,
              0,
            ),
          );

        await seekVideo(
          video,
          time,
        );

        const frame =
          analyzer.analyze(
            video,
            time * 1000,
          );

        frames.push(frame);

        setFrameCount(
          frames.length,
        );

        setProgress(
          Math.round(
            ((index + 1) /
              totalFrames) *
              100,
          ),
        );

        /*
         * Yield to the browser so
         * the progress UI remains
         * responsive.
         */
        await new Promise(
          (resolve) =>
            requestAnimationFrame(
              () =>
                resolve(
                  undefined,
                ),
            ),
        );
      }

      const replay: ReplayFile = {
        version: 2,

        simulationId:
          selected.id,

        sourceVideo:
          selected.src,

        mission,

        generatedAt:
          new Date().toISOString(),

        sampleInterval,

        duration,

        frames,

        events:
          analyzer.getEvents(),
      };

      downloadJson(
        `${selected.id}-replay.json`,
        replay,
      );

      setStatus(
        "ANALYSIS COMPLETE — JSON DOWNLOADED",
      );
    } catch (err) {
      console.error(err);

      setStatus("ERROR");

      setError(
        err instanceof Error
          ? err.message
          : "Replay generation failed.",
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "60px",
        background: "#050608",
        color: "#fff",
        fontFamily:
          "IBM Plex Mono, monospace",
      }}
    >
      <h1>
        STELLA REPLAY RECORDER
      </h1>

      <p>
        ONE-TIME OFFLINE ANALYSIS
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 30,
        }}
      >
        {VIDEOS.map(
          (video) => (
            <button
              key={video.id}
              type="button"
              onClick={() =>
                setSelected(
                  video,
                )
              }
              style={{
                padding:
                  "12px 18px",
                background:
                  selected.id ===
                  video.id
                    ? "#b7ff3c"
                    : "#151815",
                color:
                  selected.id ===
                  video.id
                    ? "#050608"
                    : "#fff",
                border:
                  "1px solid #333",
              }}
            >
              {video.name}
            </button>
          ),
        )}
      </div>

      <video
        ref={videoRef}
        src={selected.src}
        muted
        playsInline
        preload="auto"
        style={{
          display: "block",
          width: "800px",
          maxWidth: "100%",
          marginTop: 30,
          background: "#000",
        }}
      />

      <div
        style={{
          marginTop: 30,
          maxWidth: 800,
        }}
      >
        <div>
          STATUS: {status}
        </div>

        <div
          style={{
            marginTop: 12,
            height: 8,
            background:
              "#202420",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background:
                "#b7ff3c",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 10,
          }}
        >
          {progress}% —{" "}
          {frameCount} frames
        </div>

        {error && (
          <pre
            style={{
              marginTop: 20,
              padding: 20,
              color: "#ff6666",
              whiteSpace:
                "pre-wrap",
            }}
          >
            {error}
          </pre>
        )}
      </div>

      <button
        type="button"
        onClick={
          generateReplay
        }
        disabled={
          status ===
          "LOADING MODELS"
        }
        style={{
          marginTop: 30,
          padding:
            "14px 22px",
          background:
            "#b7ff3c",
          color: "#050608",
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ANALYZE & DOWNLOAD REPLAY
      </button>

      <p
        style={{
          marginTop: 30,
          maxWidth: 800,
          color: "#8f9690",
          lineHeight: 1.7,
        }}
      >
        This page is a development
        tool. It performs MediaPipe
        inference once and downloads
        the resulting replay JSON.
        Visitors to the Simulation
        Lab never execute this
        analysis.
      </p>
    </main>
  );
}

function waitForVideo(
  video: HTMLVideoElement,
) {
  if (
    video.readyState >= 2 &&
    video.videoWidth > 0
  ) {
    return Promise.resolve();
  }

  return new Promise<void>(
    (resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(
          new Error(
            "Could not load source video.",
          ),
        );
      };

      const cleanup = () => {
        video.removeEventListener(
          "loadedmetadata",
          onLoaded,
        );

        video.removeEventListener(
          "error",
          onError,
        );
      };

      video.addEventListener(
        "loadedmetadata",
        onLoaded,
      );

      video.addEventListener(
        "error",
        onError,
      );
    },
  );
}

function seekVideo(
  video: HTMLVideoElement,
  time: number,
) {
  return new Promise<void>(
    (resolve, reject) => {
      if (
        Math.abs(
          video.currentTime -
            time,
        ) < 0.01
      ) {
        resolve();
        return;
      }

      const onSeeked = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(
          new Error(
            "Video seek failed.",
          ),
        );
      };

      const cleanup = () => {
        video.removeEventListener(
          "seeked",
          onSeeked,
        );

        video.removeEventListener(
          "error",
          onError,
        );
      };

      video.addEventListener(
        "seeked",
        onSeeked,
        {
          once: true,
        },
      );

      video.addEventListener(
        "error",
        onError,
        {
          once: true,
        },
      );

      video.currentTime =
        time;
    },
  );
}

function downloadJson(
  filename: string,
  data: unknown,
) {
  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
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
  anchor.download = filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}