// The `outcomeTypes` operations.

import type { RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  ListClientOutcomeTypesQuery,
  ListOutcomeTypesQuery,
  OutcomeTypeList,
  OutcomeTypeUsage,
} from "../types.js";

/** The `outcomeTypes` operations. */
export class OutcomeTypes {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists the workspace's outcome types. Await the result for one page;
   * iterate it with `for await` for every outcome type of every page.
   *
   * Needs the `read` scope. Operation `listOutcomeTypes`.
   */
  list(
    query?: ListOutcomeTypesQuery,
    options?: RequestOptions,
  ): PagePromise<OutcomeTypeUsage, OutcomeTypeList> {
    return callPage(this.#config, "listOutcomeTypes", { query, options });
  }

  /**
   * Lists a client's outcome types. Await the result for one page; iterate
   * it with `for await` for every outcome type of every page.
   *
   * Needs the `read` scope. Operation `listClientOutcomeTypes`.
   *
   * @param clientId - the client's id.
   */
  listForClient(
    clientId: string,
    query?: ListClientOutcomeTypesQuery,
    options?: RequestOptions,
  ): PagePromise<OutcomeTypeUsage, OutcomeTypeList> {
    return callPage(this.#config, "listClientOutcomeTypes", {
      path: { id: clientId },
      query,
      options,
    });
  }
}
