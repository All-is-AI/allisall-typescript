// The `onboarding` operations.

import type { RequestOptions } from "../options.js";
import { call } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type { Onboarding, OnboardingSkippedStepsSet } from "../types.js";

/** The `onboarding` operations. */
export class OnboardingOperations {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Reads the guided setup's progress: the five steps in their fixed
   * order, each with whether the workspace's data completes it and when it
   * was skipped, and `current_step`, the first step neither completed nor
   * skipped. This is the read for the guided setup's progress.
   *
   * Needs the `read` scope. Operation `getOnboarding`.
   */
  get(options?: RequestOptions): Promise<Onboarding> {
    return call(this.#config, "getOnboarding", { options });
  }

  /**
   * Replaces the set of skipped steps, and resolves with the whole
   * progress. `steps` replaces the whole set: a step left out is no longer
   * skipped, and `[]` clears every skip. A step already skipped keeps its
   * `skipped_at`.
   *
   * Retried on a failure worth retrying, because a repeat leaves the same
   * set.
   *
   * Needs the `write` scope. Operation `setOnboardingSkippedSteps`.
   */
  setSkippedSteps(
    body: OnboardingSkippedStepsSet,
    options?: RequestOptions,
  ): Promise<Onboarding> {
    return call(this.#config, "setOnboardingSkippedSteps", { body, options });
  }
}
