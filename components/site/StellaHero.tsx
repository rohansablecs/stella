"use client";

import { useEffect, useRef } from "react";

const DESKTOP_PARTICLES = 3600;
const MOBILE_PARTICLES = 1900;

type Particle = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  drift: number;
  speed: number;
  phase: number;
};

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function ease(value: number) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

export default function StellaHero() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;

    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let progress = 0;
    let targetProgress = 0;

    let raf = 0;
    let lastTime = performance.now();

    let points: Point[] = [];
    let particles: Particle[] = [];

    let pointerX = -10000;
    let pointerY = -10000;

    const logo = new Image();
    logo.src = "/brand/logo.png";

    const buildLogo = () => {
      if (!logo.complete || !logo.naturalWidth) return;

      const sourceWidth = logo.naturalWidth;
      const sourceHeight = logo.naturalHeight;

      const buffer =
        document.createElement("canvas");

      buffer.width = sourceWidth;
      buffer.height = sourceHeight;

      const bufferCtx =
        buffer.getContext("2d", {
          willReadFrequently: true,
        });

      if (!bufferCtx) return;

      bufferCtx.clearRect(
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      bufferCtx.drawImage(
        logo,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      const image =
        bufferCtx.getImageData(
          0,
          0,
          sourceWidth,
          sourceHeight
        );

      const raw: Point[] = [];
      const data = image.data;

      const step =
        width < 700 ? 3 : 2;

      for (
        let y = 0;
        y < sourceHeight;
        y += step
      ) {
        for (
          let x = 0;
          x < sourceWidth;
          x += step
        ) {
          const i =
            (y * sourceWidth + x) * 4;

          if (data[i + 3] > 35) {
            raw.push({ x, y });
          }
        }
      }

      if (!raw.length) return;

      const count =
        width < 700
          ? MOBILE_PARTICLES
          : DESKTOP_PARTICLES;

      const logoSize =
        Math.min(width, height) *
        (width < 700 ? 0.62 : 0.72);

      const scale =
        logoSize / sourceWidth;

      const centerX =
        width / 2;

      const centerY =
        height / 2 - 8;

      points = new Array(count);

      particles = new Array(count);

      for (let i = 0; i < count; i++) {
        const sourceIndex =
          Math.floor(
            (i / count) *
              raw.length
          );

        const point =
          raw[
            Math.min(
              sourceIndex,
              raw.length - 1
            )
          ];

        points[i] = {
          x:
            centerX +
            (point.x -
              sourceWidth / 2) *
              scale,

          y:
            centerY +
            (point.y -
              sourceHeight / 2) *
              scale,
        };

        const angle =
          Math.random() *
          Math.PI *
          2;

        const radius =
          260 +
          Math.pow(
            Math.random(),
            0.72
          ) *
            Math.max(
              width,
              height
            ) *
            0.56;

        particles[i] = {
          x:
            Math.cos(angle) *
            radius *
            (0.9 +
              Math.random() *
                0.3),

          y:
            Math.sin(angle) *
            radius *
            (0.7 +
              Math.random() *
                0.3),

          size:
            i % 23 === 0
              ? 1.6
              : i % 7 === 0
                ? 1.2
                : 0.7 +
                  Math.random() *
                    0.32,

          alpha:
            0.25 +
            Math.random() *
              0.55,

          drift:
            Math.random() *
            Math.PI *
            2,

          speed:
            0.00025 +
            Math.random() *
              0.0006,

          phase:
            Math.random() *
            Math.PI *
            2,
        };
      }
    };

    const resize = () => {
      width =
        window.innerWidth;

      height =
        window.innerHeight;

      dpr = Math.min(
        window.devicePixelRatio || 1,
        1.75
      );

      canvas.width =
        Math.floor(
          width * dpr
        );

      canvas.height =
        Math.floor(
          height * dpr
        );

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      buildLogo();
    };

    /*
     * Cursor interaction.
     *
     * The pointer does not move the logo target itself.
     * It only creates a subtle local force around the
     * particles, so the formed logo remains stable.
     */
    const handlePointerMove = (
      event: PointerEvent
    ) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerLeave = () => {
      pointerX = -10000;
      pointerY = -10000;
    };

    /*
     * The hero is intentionally taller than one viewport,
     * but the stage remains sticky.
     *
     * Visually this is STILL one screen.
     *
     * The extra scroll distance is only used to give the
     * formation time to happen and then hold.
     */
    const updateScroll = () => {
      const rect =
        root.getBoundingClientRect();

      const distance =
        Math.max(
          root.offsetHeight -
            window.innerHeight,
          1
        );

      /*
       * Use only the first 68% of the available scroll
       * distance for formation.
       *
       * The remaining 32% is a clean centered hold.
       */
      const formationDistance =
        distance * 0.68;

      targetProgress =
        clamp(
          -rect.top /
            Math.max(
              formationDistance,
              1
            )
        );
    };

    const render = (
      time: number
    ) => {
      const delta =
        Math.min(
          time - lastTime,
          50
        );

      lastTime = time;

      progress +=
        (targetProgress -
          progress) *
        Math.min(
          0.085,
          delta * 0.0006
        );

      const formation =
        ease(progress);

      /*
       * The scattered field disappears.
       * The logo becomes the ONLY visible structure.
       */
      const scatterAlpha =
        Math.pow(
          1 - formation,
          3
        );

      const logoAlpha =
        Math.pow(
          formation,
          0.7
        );

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const centerX =
        width / 2;

      const centerY =
        height / 2 - 8;

      /*
       * Very subtle atmosphere.
       */
      const radius =
        Math.min(
          width,
          height
        ) * 0.45;

      const glow =
        ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );

      glow.addColorStop(
        0,
        `rgba(60,100,140,${
          0.025 +
          formation * 0.035
        })`
      );

      glow.addColorStop(
        0.45,
        `rgba(30,60,90,${
          0.012 +
          formation * 0.012
        })`
      );

      glow.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = glow;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.globalCompositeOperation =
        "lighter";

      for (
        let i = 0;
        i < particles.length;
        i++
      ) {
        const particle =
          particles[i];

        const target =
          points[i];

        if (!target) continue;

        const driftTime =
          time *
            particle.speed +
          particle.phase;

        const driftX =
          Math.sin(
            driftTime +
              particle.drift
          ) *
          6 *
          scatterAlpha;

        const driftY =
          Math.cos(
            driftTime * 0.83 +
              particle.drift
          ) *
          4 *
          scatterAlpha;

        const startX =
          centerX +
          particle.x +
          driftX;

        const startY =
          centerY +
          particle.y +
          driftY;

        let x =
          startX +
          (target.x -
            startX) *
            formation;

        let y =
          startY +
          (target.y -
            startY) *
            formation;

        /*
         * Soft cursor interaction.
         *
         * Stronger while the field is forming.
         * Very subtle once the logo is fully formed.
         */
        const dx =
          x - pointerX;

        const dy =
          y - pointerY;

        const distanceToPointer =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        const interactionRadius = 115;

        if (
          distanceToPointer <
          interactionRadius
        ) {
          const normalized =
            1 -
            distanceToPointer /
              interactionRadius;

          const force =
            normalized *
            normalized *
            (
              18 *
              (0.25 +
                (1 - formation) *
                  0.75)
            );

          const directionX =
            dx /
            Math.max(
              distanceToPointer,
              0.001
            );

          const directionY =
            dy /
            Math.max(
              distanceToPointer,
              0.001
            );

          x +=
            directionX *
            force;

          y +=
            directionY *
            force;
        }

        const alpha =
          particle.alpha *
          (
            scatterAlpha *
              0.72 +
            logoAlpha *
              0.94
          );

        if (alpha < 0.004)
          continue;

        ctx.globalAlpha =
          alpha;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          particle.size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          particle.size > 1.4
            ? "rgba(225,239,255,.96)"
            : "rgba(185,215,242,.84)";

        ctx.fill();
      }

      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation =
        "source-over";

      raf =
        requestAnimationFrame(
          render
        );
    };

    logo.onload = () => {
      resize();
    };

    if (logo.complete) {
      resize();
    }

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "scroll",
      updateScroll,
      { passive: true }
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    window.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    updateScroll();

    raf =
      requestAnimationFrame(
        render
      );

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "scroll",
        updateScroll
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="stella-hero"
      className="stella-hero"
    >
      <div className="hero-stage">
        <canvas
          ref={canvasRef}
          className="hero-particles"
          aria-hidden="true"
        />

        <div className="hero-instruction">
          <span>
            SCROLL TO FORM STELLA
          </span>
          <i />
        </div>
      </div>
    </section>
  );
}
