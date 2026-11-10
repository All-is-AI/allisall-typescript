// The `calculations` operations: a client's frozen ROI for a period, and
// the human steps that validate, publish and reopen it.

import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Calculation,
  CalculationCreate,
  CalculationList,
  CalculationSummary,
  ChecklistInput,
  ListCalculationsQuery,
  ListClientCalculationsQuery,
  WorkspaceCalculationList,
} from "../types.js";

/** The `calculations` operations. */
export class Calculations {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists the workspace's calculations across clients, without snapshots.
   * Await the result for one page; iterate it with `for await` for every
   * calculation of every page. `month` takes `YYYY-MM` and matches only a
   * period that is exactly that calendar month in UTC.
   *
   * Calculations come latest period first, then newest first.
   * `is_current` is decided among each client's own calculations for the
   * period, before any filter or page applies.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listCalculations`.
   */
  list(
    query?: ListCalculationsQuery,
    options?: RequestOptions,
  ): PagePromise<CalculationSummary, WorkspaceCalculationList> {
    return callPage(this.#config, "listCalculations", { query, options });
  }

  /**
   * Freezes a client's ROI for an ended period as a draft calculation. An
   * API key with the `write` scope may create a draft; validating and
   * publishing it need a session token.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second calculation.
   *
   * Needs the `write` scope. Operation `createCalculation`.
   *
   * @param clientId - the client's id.
   */
  createForClient(
    clientId: string,
    body: CalculationCreate,
    options?: IdempotentRequestOptions,
  ): Promise<Calculation> {
    return call(this.#config, "createCalculation", {
      path: { id: clientId },
      body,
      options,
    });
  }

  /**
   * Lists a client's calculations. Await the result for one page; iterate
   * it with `for await` for every calculation of every page.
   *
   * Needs the `read` scope. Operation `listClientCalculations`.
   *
   * @param clientId - the client's id.
   */
  listForClient(
    clientId: string,
    query?: ListClientCalculationsQuery,
    options?: RequestOptions,
  ): PagePromise<CalculationSummary, CalculationList> {
    return callPage(this.#config, "listClientCalculations", {
      path: { id: clientId },
      query,
      options,
    });
  }

  /**
   * Reads a calculation.
   *
   * Needs the `read` scope. Operation `getCalculation`.
   */
  get(id: string, options?: RequestOptions): Promise<Calculation> {
    return call(this.#config, "getCalculation", { path: { id }, options });
  }

  /**
   * Deletes a draft calculation.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteCalculation`.
   */
  delete(id: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteCalculation", { path: { id }, options });
  }

  /**
   * Validates a calculation: records the validation checklist, an
   * attestation that the figures were reviewed, and moves a draft to
   * `validated`.
   *
   * Needs a session token: validation is a human attestation. An API key
   * is refused with `403` `session_required`, as an `ApiError`. Never
   * retried.
   *
   * Operation `validateCalculation`.
   */
  validate(
    id: string,
    body: ChecklistInput,
    options?: RequestOptions,
  ): Promise<Calculation> {
    return call(this.#config, "validateCalculation", {
      path: { id },
      body,
      options,
    });
  }

  /**
   * Publishes a calculation: moves a validated calculation to `published`.
   * Publication is terminal.
   *
   * Needs a session token: publishing is a human trust step. An API key is
   * refused with `403` `session_required`, as an `ApiError`. Never retried.
   *
   * Operation `publishCalculation`.
   */
  publish(id: string, options?: RequestOptions): Promise<Calculation> {
    return call(this.#config, "publishCalculation", {
      path: { id },
      options,
    });
  }

  /**
   * Reopens a calculation: moves a validated calculation back to `draft`,
   * clearing its attestation.
   *
   * Needs a session token: it undoes a human trust step. An API key is
   * refused with `403` `session_required`, as an `ApiError`. Never retried.
   *
   * Operation `reopenCalculation`.
   */
  reopen(id: string, options?: RequestOptions): Promise<Calculation> {
    return call(this.#config, "reopenCalculation", {
      path: { id },
      options,
    });
  }
}
