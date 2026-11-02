// The `health` operations.

import type { RequestOptions } from "../options.js";
import { call } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type { Health } from "../types.js";

/** The `health` operations. */
export class HealthOperations {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Checks liveness. Sends no credential.
   *
   * Operation `getHealth`.
   */
  get(options?: RequestOptions): Promise<Health> {
    return call(this.#config, "getHealth", { options });
  }
}
