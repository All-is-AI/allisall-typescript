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
   * `today` is the date renewal dates are rolled against and `window` is
   * measured from; left out, it is the current UTC date, which the response
   * echoes. A walk sends the first page's `today` on every later page, so it
   * reads one date even across midnight UTC; to page by number instead,
   * send that `today` yourself with each `page`. `renewal_term` takes an
   * array, sent as one parameter per item; an empty array is refused
   * before sending, because leaving it out means every term.
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
