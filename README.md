# STELLA

### AI Human Activity Recognition for On-board BAS Experiments

<p align="center">
  <strong>SIH26174</strong> · Space Technology · Software · Indian Space Research Organisation (ISRO)
</p>

<p align="center">
  <a href="https://stella-iota-three.vercel.app/">🌐 Live Prototype</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/rohansablecs/stella">💻 Source Code</a>
  &nbsp;·&nbsp;
  🎥 Demo Video Coming Soon
</p>

---

## 🚀 Overview

**STELLA** is an AI-based Human Activity Recognition (HAR) and experiment-procedure validation system designed for **on-board Biological and Scientific Experiments (BAS)**.

Instead of treating an experiment camera as a passive recording device, STELLA transforms visual observations into **structured, procedure-aware events**.

The system is designed to understand:

- Astronaut activity
- Human pose and body movement
- Hand movement
- Experiment objects
- Hand-object interactions
- Temporal activity
- Current experiment step
- Procedure sequence
- Procedural deviations

STELLA then compares detected events against the **expected experiment procedure**.

When an astronaut performs an incorrect, skipped, or out-of-sequence action, STELLA can identify the procedural deviation, provide real-time guidance and voice-based alerts, and record the event as a timestamped structured log.

> **Observe → Understand → Validate → Guide → Record**

---

## 🌐 Experience STELLA

### Live Prototype

https://stella-iota-three.vercel.app/

### Source Code

https://github.com/rohansablecs/stella

### Demo Video

Coming soon.

### Technical Documentation

Coming soon.

---

# 🛰️ The Problem

Astronauts conducting biological and scientific experiments on-board a spacecraft must execute precise procedures inside a constrained environment.

A conventional camera can record an experiment.

**Recording is not understanding.**

An intelligent on-board monitoring system needs to determine:

- Who is performing the experiment?
- What activity is being performed?
- Which experiment object is involved?
- Where are the astronaut's hands and body?
- Is an actual hand-object interaction occurring?
- Does the detected action correspond to the expected experiment step?
- Was a step skipped?
- Was an action performed out of sequence?
- What should happen next?
- What should be logged for later analysis?

STELLA addresses this as a:

**Perception → Recognition → Temporal Reasoning → Procedure Validation**

problem.

---

# 🧠 What STELLA Does

At its core, STELLA converts raw visual observations into **experiment-aware events**.

```text
FIXED-PAYLOAD CAMERA
        │
        ▼
    LOCAL VIDEO
        │
        ▼
┌───────────────────────┐
│   VISUAL PERCEPTION   │
│                       │
│  • Astronaut          │
│  • Pose               │
│  • Hands              │
│  • Objects            │
│  • Interactions       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ ACTIVITY RECOGNITION  │
│       +               │
│ TEMPORAL ANALYSIS     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   PROCEDURE ENGINE    │
│                       │
│ Expected → Detected   │
│ Sequence Validation   │
│ Step State Tracking   │
└───────────┬───────────┘
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
   GUIDANCE ALERTS LOGS
            │
            ▼
      MISSION CONTROL
