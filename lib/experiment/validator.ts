
import type { Activity } from "@/lib/vision/types";

import {
  getExperiment,
  type ExperimentDefinition,
} from "./definitions";

import {
  getActiveMissionId,
} from "./missionStore";

import type {
  ProcedureState,
} from "./sequence";

export type ValidationKind =
  | "VALID"
  | "WARNING"
  | "GUIDANCE";

export type ValidationResult = {
  state: ProcedureState;
  kind: ValidationKind | null;
  message: string | null;
  voice: string | null;
};

type ValidatorInput = {
  now: number;
  poseDetected: boolean;
  activity: Activity;
  interaction: boolean;
};

export class ProcedureValidator {
  private state: ProcedureState = "WAITING";

  private interactionStarted: number | null = null;
  private interactionLostAt: number | null = null;
  private releaseStarted: number | null = null;

  private experiment: ExperimentDefinition =
    getExperiment(getActiveMissionId());

  private experimentId =
    getActiveMissionId();

  private lastWarning = "";

  private readonly graspHold = 350;
  private readonly moveHold = 1200;
  private readonly releaseHold = 450;
  private readonly withdrawHold = 700;

  getExperiment() {
    return this.experiment;
  }

  getState() {
    return this.state;
  }

  reset() {
    this.state = "WAITING";
    this.interactionStarted = null;
    this.interactionLostAt = null;
    this.releaseStarted = null;
    this.lastWarning = "";
  }

  private syncMission() {
    const id = getActiveMissionId();

    if (id === this.experimentId) return;

    this.experimentId = id;
    this.experiment = getExperiment(id);
    this.reset();
  }

  private result(
    kind: ValidationKind,
    message: string,
    voice: string,
  ): ValidationResult {
    return {
      state: this.state,
      kind,
      message,
      voice,
    };
  }

  private empty(): ValidationResult {
    return {
      state: this.state,
      kind: null,
      message: null,
      voice: null,
    };
  }

  private warning(
    message: string,
    voice: string,
  ) {
    if (this.lastWarning === message) {
      return this.empty();
    }

    this.lastWarning = message;

    return this.result(
      "WARNING",
      message,
      voice,
    );
  }

  update(input: ValidatorInput): ValidationResult {
    this.syncMission();

    const {
      now,
      poseDetected,
      activity,
      interaction,
    } = input;

    if (this.state === "COMPLETE") {
      return this.empty();
    }

    /*
     * READY
     */
    if (
      this.state === "WAITING" &&
      poseDetected
    ) {
      this.state = "SUBJECT_DETECTED";
      this.lastWarning = "";

      return this.result(
        "VALID",
        "Operator presence validated.",
        "Operator detected. Begin the procedure.",
      );
    }

    /*
     * Out-of-order interaction before reach.
     */
    if (
      this.state === "SUBJECT_DETECTED" &&
      interaction
    ) {
      return this.warning(
        "OUT OF SEQUENCE — object interaction detected before the reach step.",
        "Out of sequence. Reach toward the object first.",
      );
    }

    /*
     * REACH
     */
    if (
      this.state === "SUBJECT_DETECTED" &&
      activity === "REACHING"
    ) {
      this.state = "REACH";
      this.lastWarning = "";

      return this.result(
        "VALID",
        "Reach phase detected.",
        "Reach detected. Grasp the object.",
      );
    }

    if (
      this.state === "REACH" &&
      interaction
    ) {
      /*
       * Start grasp evidence as soon as the hand reaches
       * the interaction envelope.
       */
      if (this.interactionStarted === null) {
        this.interactionStarted = now;
      }

      this.interactionLostAt = null;

      if (
        now - this.interactionStarted >=
        this.graspHold
      ) {
        this.state = "GRASP";
        this.interactionStarted = now;
        this.interactionLostAt = null;
        this.lastWarning = "";

        return this.result(
          "VALID",
          "Sustained hand-object interaction validated.",
          "Grasp validated. Move the object.",
        );
      }

      return this.empty();
    }

    if (this.state === "REACH") {
      /*
       * MediaPipe can briefly lose a hand/object for one or
       * two frames. Do not immediately destroy grasp evidence.
       */
      if (
        this.interactionStarted !== null
      ) {
        if (
          this.interactionLostAt === null
        ) {
          this.interactionLostAt = now;
        }

        if (
          now -
            this.interactionLostAt <
          300
        ) {
          return this.empty();
        }
      }

      this.interactionStarted = null;
      this.interactionLostAt = null;

      return this.empty();
    }

    /*
     * GRASP → MOVE
     */
    if (this.state === "GRASP") {
      if (!interaction) {
        /*
         * Brief detector flicker should not immediately
         * cancel the manipulation phase.
         */
        if (
          this.interactionLostAt === null
        ) {
          this.interactionLostAt = now;
        }

        if (
          now -
            this.interactionLostAt <
          350
        ) {
          return this.empty();
        }

        this.interactionStarted = null;

        return this.warning(
          "INTERACTION LOST — manipulation has not been completed.",
          "Maintain interaction with the object.",
        );
      }

      this.interactionLostAt = null;

      if (this.interactionStarted === null) {
        this.interactionStarted = now;
      }

      if (
        now - this.interactionStarted >=
        this.moveHold
      ) {
        this.state = "MOVE";
        this.interactionStarted = null;
        this.lastWarning = "";

        return this.result(
          "VALID",
          "Manipulation phase validated.",
          "Manipulation validated. Place the object.",
        );
      }

      return this.empty();
    }

    /*
     * MOVE → PLACE
     */
    if (this.state === "MOVE") {
      if (interaction) {
        this.releaseStarted = null;
        return this.empty();
      }

      if (this.releaseStarted === null) {
        this.releaseStarted = now;
      }

      if (
        now - this.releaseStarted >=
        this.releaseHold
      ) {
        this.state = "PLACE";
        this.releaseStarted = now;
        this.lastWarning = "";

        return this.result(
          "VALID",
          "Object release detected. Placement validated.",
          "Placement detected. Withdraw from the object.",
        );
      }

      return this.empty();
    }

    /*
     * PLACE → WITHDRAW
     */
    if (this.state === "PLACE") {
      if (interaction) {
        this.releaseStarted = null;

        return this.warning(
          "INTERACTION RESUMED — placement is not yet complete.",
          "Release the object and withdraw.",
        );
      }

      if (this.releaseStarted === null) {
        this.releaseStarted = now;
      }

      if (
        now - this.releaseStarted >=
        this.withdrawHold
      ) {
        this.state = "WITHDRAW";
        this.releaseStarted = null;
        this.lastWarning = "";

        return this.result(
          "VALID",
          "Operator withdrawal validated.",
          "Withdrawal detected. Mission complete.",
        );
      }

      return this.empty();
    }

    /*
     * WITHDRAW → COMPLETE
     */
    if (
      this.state === "WITHDRAW" &&
      !interaction
    ) {
      this.state = "COMPLETE";

      return this.result(
        "VALID",
        `${this.experiment.name} completed and recorded.`,
        `${this.experiment.name} mission complete.`,
      );
    }

    return this.empty();
  }
}
