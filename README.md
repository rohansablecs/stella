STELLA

AI Human Activity Recognition for On-board BAS Experiments

SIH26174 · Space Technology · Software · Indian Space Research Organisation (ISRO)

STELLA is an AI-based Human Activity Recognition (HAR) and experiment-procedure validation system designed for on-board BAS experiments.

It transforms continuous video from fixed-payload cameras into structured understanding of astronaut activity, pose, hands, experiment objects and hand-object interactions, then validates those events against a predefined experiment procedure.

When the astronaut performs an incorrect, skipped or out-of-sequence action, STELLA detects the procedural deviation, provides real-time guidance and voice-based alerts, and records the event as a timestamped structured log.

⸻

🚀 Experience STELLA

Resource	Link
🌐 Live Prototype	https://stella-iota-three.vercel.app/
💻 Source Code	https://github.com/rohansablecs/stella
🎥 Demo Video	Coming soon
📚 Documentation	Coming soon

The live prototype provides the mission-control interface and demonstration workflow. The repository contains the implementation and project source.

⸻

01 — The Problem

Astronauts conducting biological and scientific experiments on-board a spacecraft must execute procedures accurately inside a constrained environment.

A conventional camera system can record the experiment, but recording is not understanding.

A useful on-board monitoring system needs to determine:

* Who is performing the experiment?
* What activity is being performed?
* Which experiment object is involved?
* Where are the astronaut’s hands and body?
* Is an actual hand-object interaction occurring?
* Does the detected action correspond to the expected experiment step?
* Was a step skipped?
* Was an action performed out of sequence?
* What should happen next?
* What should be logged for later analysis?

STELLA addresses this as a perception → recognition → temporal reasoning → procedure validation problem.

⸻

02 — What STELLA Does

At its core, STELLA converts raw visual observations into experiment-aware events.

FIXED-PAYLOAD CAMERA
        │
        ▼
   LOCAL VIDEO
        │
        ▼
 ┌───────────────────────┐
 │  VISUAL PERCEPTION    │
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
 │ PROCEDURE ENGINE      │
 │                       │
 │ Expected → Detected   │
 │ Sequence validation   │
 │ Step state tracking   │
 └───────────┬───────────┘
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
    GUIDANCE ALERTS LOGS
             │
             ▼
       MISSION CONTROL

The important distinction is that STELLA does not stop at “what action is this?”

It asks:

“What action is happening, what object is involved, where are we in the experiment, and is this action valid for the current procedure state?”

⸻

03 — Core Capabilities

👨‍🚀 Human Activity Recognition

STELLA analyzes temporal video information to recognize experiment-specific astronaut activities.

The activity-recognition layer is designed around temporal action understanding, rather than treating every frame as an independent classification problem.

⸻

🧍 Human Pose & Body Tracking

Pose information provides spatial context for the astronaut’s movement and activity.

STELLA’s perception pipeline can incorporate:

* Human pose estimation
* Body keypoints
* Hand landmarks
* Temporal movement
* Body-relative interaction context

The system is designed to avoid relying exclusively on a conventional floor/up assumption when reasoning about the experiment environment.

⸻

✋ Hand Tracking & Hand-Object Interaction

An important part of experiment understanding is distinguishing:

HAND NEAR OBJECT

from:

HAND ACTUALLY INTERACTING WITH OBJECT

STELLA combines hand/pose information with object tracking to reason about interactions such as:

Approach
   ↓
Contact
   ↓
Grasp / Interaction
   ↓
Move
   ↓
Release

This allows experiment actions to be represented as meaningful activity-object events.

⸻

📦 Object Detection

Experiment objects are detected and tracked as part of the perception pipeline.

Object information can include:

* Object identity
* Bounding box
* Confidence
* Tracking information
* Interaction association

The object layer provides the context required to distinguish visually similar human activities.

⸻

🧠 Temporal Activity Recognition

A single frame often cannot determine what an astronaut is doing.

STELLA therefore processes activity over time.

Conceptually:

FRAME t-12
    ↓
FRAME t-11
    ↓
   ...
    ↓
FRAME t
    ↓
TEMPORAL FEATURE WINDOW
    ↓
ACTIVITY

The prototype architecture uses X3D-S as the temporal activity-recognition foundation.

⸻

04 — Procedure Intelligence

This is the core layer that turns perception into an experiment-monitoring system.

Each experiment is represented as a predefined procedure.

For example:

STEP 01
Pick up sample container
        ↓
STEP 02
Move container to workspace
        ↓
STEP 03
Open container
        ↓
STEP 04
Transfer sample
        ↓
STEP 05
Return container

STELLA maintains the current procedure state and compares detected events against the expected next action.

EXPECTED EVENT
      │
      ▼
DETECTED EVENT
      │
      ▼
┌─────────────────┐
│ PROCEDURE MATCH │
└───────┬─────────┘
        │
   ┌────┴─────┐
   ▼          ▼
 VALID      DEVIATION
   │          │
   ▼          ▼
 NEXT STEP   ALERT

⸻

05 — Sequence Validation

STELLA can represent procedure execution as a state machine.

Correct execution

STEP 01 ✓
   ↓
STEP 02 ✓
   ↓
STEP 03 ✓
   ↓
STEP 04 ✓
   ↓
STEP 05 ✓
   ↓
MISSION COMPLETE

Skipped step

STEP 01 ✓
   ↓
STEP 02 ✓
   ↓
STEP 03 ✕
   ↓
STEP 04 DETECTED
   ↓
⚠ PROCEDURE DEVIATION
   ↓
COMPLETE STEP 03

Out-of-sequence action

EXPECTED:
STEP 03
DETECTED:
STEP 04
        ↓
⚠ OUT OF SEQUENCE
        ↓
VOICE ALERT
        ↓
NEXT REQUIRED STEP:
STEP 03

This procedure-aware reasoning is one of the central differentiators of STELLA.

⸻

06 — Real-Time Guidance

When the detected event does not match the current procedure state, STELLA can generate corrective guidance.

Examples:

"Procedure deviation detected."
"Complete the previous step before continuing."
"Step 3 is required."
"Incorrect sequence detected."

Guidance can be surfaced through:

* Mission-control UI
* Current-step indicators
* Next-step suggestions
* Voice-based alerts

The goal is to provide actionable procedure feedback, rather than merely reporting that an AI model produced an incorrect classification.

⸻

07 — Event Logging

Every meaningful event can be converted into a structured record.

Example:

{
  "timestamp": "00:01:42",
  "experiment": "ORBIT",
  "step": 3,
  "action": "place_object",
  "object": "sample_container",
  "status": "OUT_OF_SEQUENCE",
  "confidence": 0.91,
  "procedure_deviation": true
}

The event-log layer is designed to preserve:

* Timestamp
* Experiment
* Procedure step
* Detected activity
* Object
* Interaction
* Confidence
* Outcome
* Status
* Procedure deviation

Supported lightweight outputs include JSON/text structured logs.

⸻

08 — Local Video & Streaming

The system architecture supports local experiment recording while allowing configurable video streaming.

CAMERA
  │
  ├──────────────► LOCAL PROCESSING
  │
  ├──────────────► MP4 SESSION RECORDING
  │
  └──────────────► RTSP / RTP
                       │
                       ▼
                 SPECIFIC IP

This separates:

AI inference

from:

video storage

from:

optional video streaming

and allows the deployment architecture to be adapted to the experiment environment.

⸻

09 — Offline / Edge Architecture

STELLA is designed around local processing rather than requiring continuous cloud access for the core perception and procedure-validation workflow.

Conceptually:

                 ┌───────────────┐
CAMERA ────────► │ EDGE / LOCAL  │
                 │ AI PIPELINE    │
                 └───────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       ACTIVITY       PROCEDURE       EVENTS
       RECOGNITION    VALIDATION      / LOGS

This architecture reduces dependency on transmitting raw experiment video to a remote service and allows procedure monitoring, alerts and event logging to remain local to the experiment-processing environment.

⸻

10 — System Architecture

┌───────────────────────────────────────────────────────────────┐
│                     FIXED-PAYLOAD CAMERA                      │
│                  USB / CSI / IP VIDEO INPUT                   │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                       VIDEO PIPELINE                           │
│        Local Capture → Frame Buffer → Temporal Window         │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                     VISUAL PERCEPTION                         │
│                                                               │
│  YOLO11n         MediaPipe         Pose / Hand Tracking        │
│  Objects         Hands             Body Keypoints              │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                    ACTIVITY RECOGNITION                        │
│                                                               │
│                       X3D-S HAR                               │
│              Temporal Activity Recognition                    │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                  INTERACTION ANALYSIS                          │
│                                                               │
│       Hand + Pose + Object + Temporal Association              │
│                                                               │
│                  Activity-Object Event                         │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                   PROCEDURE ENGINE                             │
│                                                               │
│   Predefined Experiment Procedure                             │
│   State Machine                                                │
│   Step Tracking                                                │
│   Sequence Validation                                          │
│   Skipped-Step Detection                                       │
│   Out-of-Sequence Detection                                    │
│   Procedure Mismatch Detection                                 │
└──────────────────────────────┬────────────────────────────────┘
                               │
                 ┌─────────────┼──────────────┐
                 ▼             ▼              ▼
          ┌────────────┐ ┌────────────┐ ┌──────────────┐
          │ GUIDANCE   │ │ VOICE      │ │ EVENT LOG    │
          │            │ │ ALERTS     │ │              │
          │ Next Step  │ │ TTS        │ │ JSON / TEXT  │
          └────────────┘ └────────────┘ └──────────────┘
                 │             │              │
                 └─────────────┼──────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                     MISSION CONTROL                            │
│                         Next.js                               │
│                                                               │
│ Monitoring · Step Progress · Alerts · Logs · Playback         │
└───────────────────────────────────────────────────────────────┘

⸻

11 — Technology Stack

AI / Computer Vision

Component	Role
X3D-S	Temporal Human Activity Recognition
YOLO11n	Experiment-object detection
MediaPipe	Pose / hand tracking and landmarks
3D HMR integration path	Orientation-aware human mesh / body representation
Temporal reasoning	Activity sequence interpretation
Procedure state machine	Experiment sequence validation

Application

Technology	Role
Next.js	Mission-control interface
React	Interactive application UI
WebSocket	Real-time event communication
SQLite	Local event/session indexing
JSON / Text	Structured event export
MP4 / FFmpeg	Local session video
RTSP / RTP	Configurable video streaming
Text-to-Speech	Voice guidance and alerts

⸻

12 — Experiment-Specific Dataset

STELLA is designed around the idea that generic action-recognition datasets are not sufficient for experiment-specific procedures.

The experiment itself defines the data requirements.

EXPERIMENT PROCEDURE
        │
        ▼
ACTION DEFINITIONS
        │
        ├── Activity Labels
        ├── Object Labels
        ├── Pose Keypoints
        ├── Hand Landmarks
        ├── Hand-Object Interaction
        └── Procedure Step Labels
        │
        ▼
EXPERIMENT-SPECIFIC DATASET
        │
        ▼
MODEL TRAINING / VALIDATION

The dataset structure can therefore evolve with the experiment rather than forcing every experiment into a generic activity vocabulary.

⸻

13 — STELLA Mission Workflow

The prototype follows a complete mission-style workflow:

INTRO
  ↓
CAMERA PERMISSION
  ↓
CALIBRATION
  ↓
EXPERIMENT LIBRARY
  ↓
EXPERIMENT SELECTION
  ↓
SESSION INITIALIZATION
  ↓
LIVE CAMERA / VIDEO
  ↓
PERCEPTION
  ↓
ACTIVITY RECOGNITION
  ↓
PROCEDURE VALIDATION
  ↓
GUIDANCE / ALERT
  ↓
EVENT LOGGING
  ↓
SESSION SUMMARY
  ↓
VIDEO + LOG EXPORT

The system is designed so that the AI pipeline can evolve independently from the mission-control interface.

⸻

14 — Prototype Experiments

The current STELLA demonstration environment includes experiment scenarios used to demonstrate the procedure-monitoring workflow.

ORBIT

Experiment workflow demonstrating activity recognition, object interaction and procedure progression.

APOLLO

Experiment scenario for demonstrating an alternate predefined activity sequence.

LUNARIS

Experiment scenario for demonstrating another experiment-specific interaction workflow.

The experiment engine is designed so that additional procedures can be represented as configurable sequences rather than requiring a complete rewrite of the monitoring system.

⸻

15 — Mission Control

The STELLA interface is designed as an operational mission-control environment rather than a conventional AI dashboard.

The interface provides visibility into:

* Camera state
* Calibration
* Current experiment
* Current procedure step
* Detected activity
* Astronaut pose
* Hand tracking
* Object detection
* Interaction state
* Confidence
* Procedure status
* Alerts
* Event history
* Session information
* Video playback
* Structured log export

The interface is intended to answer one question immediately:

What is happening in the experiment right now, and is it correct?

⸻

16 — Failure-Aware Demonstration

A major part of STELLA’s demonstration is intentionally performing an incorrect procedure.

Normal

ACTION
  ↓
DETECTED
  ↓
MATCHES EXPECTED STEP
  ↓
✓ VALIDATED
  ↓
NEXT STEP

Incorrect

ACTION
  ↓
DETECTED
  ↓
DOES NOT MATCH EXPECTED STEP
  ↓
⚠ PROCEDURE DEVIATION
  ↓
VOICE ALERT
  ↓
NEXT REQUIRED STEP

This demonstrates that STELLA is not merely displaying AI predictions.

It is using those predictions to make a procedure-level decision.

⸻

17 — Why Multiple AI Models?

STELLA intentionally separates different perception tasks.

A single model does not need to solve the entire problem.

                    VIDEO
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       OBJECT       POSE         HAND
       MODEL        MODEL        MODEL
          │           │           │
          └───────────┼───────────┘
                      ▼
               INTERACTION
                 ANALYSIS
                      │
                      ▼
              ACTIVITY MODEL
                      │
                      ▼
             PROCEDURE ENGINE

This modular approach makes the system easier to adapt to:

* New experiments
* New objects
* New activity classes
* Different camera configurations
* Updated activity-recognition models
* Different procedure definitions

⸻

18 — Orientation & Microgravity Considerations

Traditional human-activity systems often implicitly assume a conventional relationship between the body, floor and gravity.

An on-board space experiment introduces a different reference-frame problem.

STELLA therefore treats the payload/experiment environment as the relevant spatial reference rather than relying exclusively on a conventional floor/up assumption.

The architecture also includes an orientation-aware 3D Human Mesh Recovery integration path for future expansion of body representation in non-terrestrial orientations.

Implementation note: 3D HMR functionality should be treated according to the capabilities actually demonstrated by the current prototype and integrated model pipeline. It is not presented here as a claim of flight qualification.

⸻

19 — Design Principles

STELLA is built around several principles.

1. Observe

Continuously process the experiment’s visual environment.

2. Understand

Convert visual observations into astronaut activity and interaction events.

3. Validate

Compare detected events against the expected experiment procedure.

4. Guide

Provide actionable feedback when the procedure deviates.

5. Record

Create a structured digital trace of the experiment session.

OBSERVE
   ↓
UNDERSTAND
   ↓
VALIDATE
   ↓
GUIDE
   ↓
RECORD

⸻

20 — Research Foundation

STELLA builds on established research and open-source technologies in:

* Human Activity Recognition
* Spatiotemporal video understanding
* Object detection
* Human pose estimation
* Hand tracking
* Multi-object tracking
* Human mesh recovery
* Computer vision
* Edge AI
* Procedure/state-machine reasoning
* Spaceflight human factors

Relevant foundations include:

* X3D — Efficient video models for spatiotemporal action recognition
* ST-GCN — Spatial-temporal graph convolutional networks for skeleton-based action recognition
* YOLO — Real-time object detection
* Deep SORT — Multi-object tracking
* OpenCV — Computer vision and video processing
* MediaPipe — Real-time perception and landmark tracking
* Human Mesh Recovery (HMR) research for 3D body representation
* NASA / ESA research and publicly available material concerning human activity, automation and space operations

⸻

21 — SIH26174 Requirement Mapping

Problem Requirement	STELLA Implementation
AI Human Activity Recognition	Temporal HAR pipeline using X3D-S
On-board experiment monitoring	Local experiment-monitoring architecture
Fixed-payload camera	USB / CSI / IP video input architecture
Continuous video processing	Local frame buffering and temporal analysis
Astronaut activity recognition	Experiment-specific activity classes
Object detection	YOLO11n
Pose estimation	Pose tracking / keypoints
Hand tracking	Hand landmarks
Hand-object interaction	Hand + object association
Experiment sequence	Configurable procedure definition
Step validation	Procedure state machine
Skipped step detection	Expected-vs-detected procedure comparison
Out-of-sequence detection	Procedure state validation
Next-step guidance	Current/next required procedure state
Voice alerts	TTS-based guidance
Event logging	Timestamped structured JSON/text
Session records	Session metadata and event index
Local video storage	MP4 session recording
IP video streaming	RTSP/RTP architecture
GUI	Next.js mission-control interface
Experiment-specific data	Activity/object/pose/interaction/procedure labels

⸻

22 — Security & Operational Philosophy

The architecture is designed with local processing in mind.

The core workflow does not require raw experiment video to be continuously uploaded to an external cloud service.

CAMERA
  ↓
LOCAL INFERENCE
  ↓
EVENTS
  ↓
LOCAL PROCEDURE VALIDATION
  ↓
LOCAL LOGGING

This provides an architecture suitable for environments where:

* Connectivity may be limited
* Latency matters
* Raw video transmission is undesirable
* Local decision-making is valuable
* Structured event data is preferable to continuous raw-video transfer

⸻

23 — Extensibility

STELLA is designed as a platform rather than a single hard-coded activity classifier.

Future experiment definitions can introduce:

NEW EXPERIMENT
      │
      ├── New objects
      ├── New activities
      ├── New interactions
      ├── New procedure sequence
      └── New validation rules

without changing the conceptual architecture.

The long-term architecture can support:

* Additional BAS experiments
* More experiment-specific activity classes
* More sophisticated 3D body representation
* Improved microgravity-domain adaptation
* Expanded object libraries
* More robust temporal reasoning
* Experiment authoring tools
* Hardware-accelerated edge deployment
* Additional camera configurations
* Larger mission-session analytics
* Integration into future crewed-spaceflight experiment workflows

⸻

24 — Roadmap

Current Prototype

* AI-assisted human activity recognition
* Fixed-camera video workflow
* Astronaut pose perception
* Hand tracking
* Object detection
* Hand-object interaction reasoning
* Experiment procedure state machine
* Step progression
* Sequence validation
* Out-of-sequence / procedural deviation handling
* Next-step guidance
* Voice alerts
* Timestamped event logging
* JSON/text export
* Local session recording
* Mission-control GUI

Extension Path

* Larger experiment-specific datasets
* More diverse microgravity video
* Improved orientation-aware 3D body representation
* Hardware-accelerated edge inference
* Robust domain adaptation
* Expanded experiment libraries
* Automated experiment dataset generation
* Advanced temporal reasoning
* Hardware-in-the-loop validation
* Flight-like camera and payload environments

⸻

25 — Project Structure

A simplified conceptual structure:

stella/
│
├── src/
│   ├── app/
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── ...
│   │
│   ├── data/
│   │   └── experiments/
│   │
│   ├── models/
│   │   └── ...
│   │
│   └── ...
│
├── public/
│   └── ...
│
├── README.md
├── package.json
└── ...

The exact repository structure may evolve as the perception and inference layers are separated further from the mission-control application.

⸻

26 — Quick Start

Clone the repository:

git clone https://github.com/rohansablecs/stella.git
cd stella

Install dependencies:

npm install

Start the development server:

npm run dev

Open the local application:

http://localhost:3000

The deployed prototype is available at:

https://stella-iota-three.vercel.app/

⸻

27 — Demo Scenario

The recommended STELLA demonstration follows one complete experiment.

MISSION START
     │
     ▼
CAMERA CONNECTED
     │
     ▼
CALIBRATION
     │
     ▼
SELECT ORBIT
     │
     ▼
STEP 01
Astronaut performs expected action
     │
     ▼
✓ VALIDATED
     │
     ▼
STEP 02
Astronaut performs expected action
     │
     ▼
✓ VALIDATED
     │
     ▼
STEP 03
Astronaut deliberately performs wrong action
     │
     ▼
⚠ OUT OF SEQUENCE
     │
     ▼
VOICE ALERT
     │
     ▼
NEXT REQUIRED STEP SHOWN
     │
     ▼
EVENT LOG GENERATED
     │
     ▼
SESSION SUMMARY

The demonstration is designed to make the entire intelligence chain visible:

FOOTAGE
   ↓
PERCEPTION
   ↓
RECOGNITION
   ↓
EVENT
   ↓
PROCEDURE DECISION
   ↓
GUIDANCE
   ↓
LOG

⸻

28 — What Makes STELLA Different

STELLA is not intended to be just:

VIDEO → ACTION CLASS

It is:

VIDEO
  ↓
WHO?
  ↓
WHAT IS THE ASTRONAUT DOING?
  ↓
WHICH OBJECT IS INVOLVED?
  ↓
IS THERE A REAL INTERACTION?
  ↓
WHAT PROCEDURE STEP ARE WE ON?
  ↓
DOES THE ACTION MATCH THE PROCEDURE?
  ↓
WHAT SHOULD HAPPEN NEXT?
  ↓
IS AN ALERT REQUIRED?
  ↓
WHAT SHOULD BE RECORDED?

That transformation — from visual perception to procedure-aware experiment intelligence — is the central idea behind STELLA.

⸻

29 — Project Information

Field	Details
Project	STELLA
Problem Statement	SIH26174
Problem Statement	AI Human Activity Recognition for On-board BAS Experiments
Organization	Indian Space Research Organisation (ISRO)
Theme	Space Technology
Category	Software
Team	Celestia_J
Team ID	163812
Primary Interface	Next.js
Live Prototype	https://stella-iota-three.vercel.app/
Repository	https://github.com/rohansablecs/stella

⸻

30 — Links

🌐 Live Prototype

https://stella-iota-three.vercel.app/

💻 GitHub Repository

https://github.com/rohansablecs/stella

🎥 Demonstration Video

Coming soon.

📚 Technical Documentation

Coming soon.

⸻

31 — Acknowledgements

STELLA was developed as a response to Smart India Hackathon 2026 Problem Statement SIH26174, concerning AI-based Human Activity Recognition for on-board BAS experiments.

The project builds upon research and open-source work in computer vision, video understanding, human pose estimation, object detection, temporal activity recognition and human mesh recovery.

We acknowledge the broader research communities and open-source projects that make these technologies accessible for experimentation and prototyping.

⸻

32 — Keywords

SIH26174
Smart India Hackathon 2026
ISRO
Indian Space Research Organisation
Space Technology
BAS
Biological and Scientific Experiments
On-board Experiments
Astronaut
Human Activity Recognition
HAR
AI
Computer Vision
Edge AI
On-device AI
Offline AI
Fixed-Payload Camera
Local Video Processing
Video Understanding
Temporal Activity Recognition
X3D-S
YOLO11n
Object Detection
Human Pose Estimation
Pose Tracking
Hand Tracking
Hand-Object Interaction
Human Mesh Recovery
3D HMR
Orientation-Aware Perception
Microgravity
Experiment Procedure
Procedure Validation
Sequence Validation
State Machine
Step Tracking
Skipped Step Detection
Out-of-Sequence Detection
Procedure Deviation
Next-Step Guidance
Voice Alert
Text-to-Speech
TTS
Real-Time Monitoring
Event Logging
Timestamped Logs
Structured Logs
JSON
Session Recording
MP4
RTSP
RTP
IP Streaming
SQLite
WebSocket
Next.js
React
Mission Control
Experiment Monitoring
Edge Inference
Spaceflight
Gaganyaan
Crewed Spaceflight
BAS Experiments

⸻

33 — The STELLA Concept

A camera sees the astronaut.

STELLA understands the action.

The procedure engine understands the mission.

The guidance system knows what should happen next.

The event log remembers what happened.

                 STELLA
                   │
        ┌──────────┴──────────┐
        │                     │
     PERCEIVE             UNDERSTAND
        │                     │
        └──────────┬──────────┘
                   │
                VALIDATE
                   │
              ┌────┴────┐
              │         │
           GUIDE      RECORD
              │         │
              └────┬────┘
                   │
             MISSION AWARENESS

Observe. Understand. Validate. Guide.

⸻

License

This repository is a project prototype developed for Smart India Hackathon 2026.

See the repository for the applicable source-code license and project-specific terms.
