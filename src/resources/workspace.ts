// The `workspace` operations.

import type { RequestOptions } from "../options.js";
import { call } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type { Workspace } from "../types.js";

/** The `workspace` operations. */
export class WorkspaceOperations {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Reads the workspace the credential belongs to: its name, its currency
   * and when it was created.
   *
   * Needs the `read` scope. Operation `getWorkspace`.
   */
  get(options?: RequestOptions): Promise<Workspace> {
    return call(this.#config, "getWorkspace", { options });
  }
}
