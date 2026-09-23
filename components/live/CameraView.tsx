"use client";

import type {
  RefObject,
} from "react";

type CameraViewProps = {
  videoRef: RefObject<
    HTMLVideoElement | null
  >;

  canvasRef: RefObject<
    HTMLCanvasElement | null
  >;

  running: boolean;
  loading: boolean;

  fps: number;

  onStart: () => void;
};

export default function CameraView({
  videoRef,
  canvasRef,
  running,
  loading,
  fps,
  onStart,
}: CameraViewProps) {
  return (
    <section className="camera-panel">
      <div className="camera-toolbar">
        <div className="toolbar-left">
          <span className="live-dot" />

          <span>
            PERCEPTION STREAM
          </span>
        </div>

        <div className="toolbar-right">
          <span>
            {fps} FPS
          </span>

          <span>
            LOCAL
          </span>
        </div>
      </div>

      <div className="camera-stage">
        <video
          ref={videoRef}
          className="live-video"
          autoPlay
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          className="live-canvas"
        />

        {!running && (
          <div className="camera-idle">
            <div className="target-icon">
              <span />
            </div>

            <strong>
              VISION SYSTEM READY
            </strong>

            <p>
              Start the camera to begin
              local perception.
            </p>

            <button
              className="launch-button"
              onClick={onStart}
              disabled={loading}
            >
              {loading
                ? "LOADING MODELS"
                : "START LIVE AI"}
            </button>
          </div>
        )}

        <div className="camera-corner tl" />
        <div className="camera-corner tr" />
        <div className="camera-corner bl" />
        <div className="camera-corner br" />

        {running && (
          <div className="camera-overlay-status">
            TRACKING ENABLED
          </div>
        )}
      </div>
    </section>
  );
}