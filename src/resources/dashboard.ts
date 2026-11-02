// The `dashboard` operations.

import type { RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Dashboard,
  GetDashboardQuery,
  ListRenewalsQuery,
  Renewal,
  RenewalList,
} from "../types.js";

/** The `dashboard` operations. */
export class DashboardOperations {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Reads the workspace's month: its published figures for the calendar
   * month `month`, such as `2026-08`, which is required.
   *
   * Needs the `read` scope. Operation `getDashboard`.
   */
  get(query: GetDashboardQuery, options?: RequestOptions): Promise<Dashboard> {
    return call(this.#config, "getDashboard", { query, options });
  }

  /**
   * Lists renewal readiness: each client's latest published figures,
   * whatever month `get` reads. Await the result for one page; iterate it
   * with `for await` for every client of every page.
   *
   * Needs the `read` scope. Operation `listRenewals`.
   */
  listRenewals(
    query?: ListRenewalsQuery,
    options?: RequestOptions,
  ): PagePromise<Renewal, RenewalList> {
    return callPage(this.#config, "listRenewals", { query, options });
  }
}
