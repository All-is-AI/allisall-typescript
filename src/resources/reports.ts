// The `reports` operations: a report on a published calculation, and the
// human steps that share it and revoke its link.

import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  ListCalculationReportsQuery,
  ListReportsQuery,
  Report,
  ReportList,
  ReportPatch,
  ReportSummary,
  ReportWithPreview,
  WorkspaceReportList,
} from "../types.js";

/** The `reports` operations. */
export class Reports {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists the workspace's reports across calculations, newest first, each
   * without its disclosures. Await the result for one page; iterate it with
   * `for await` for every report of every page.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listReports`.
   */
  list(
    query?: ListReportsQuery,
    options?: RequestOptions,
  ): PagePromise<ReportSummary, WorkspaceReportList> {
    return callPage(this.#config, "listReports", { query, options });
  }

  /**
   * Composes a report on a published calculation, with its disclosures
   * taken from the calculation's coverage.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second report.
   *
   * Needs the `write` scope. Operation `createReport`.
   *
   * @param calculationId - the calculation's id.
   */
  createForCalculation(
    calculationId: string,
    options?: IdempotentRequestOptions,
  ): Promise<Report> {
    return call(this.#config, "createReport", {
      path: { id: calculationId },
      options,
    });
  }

  /**
   * Lists a calculation's reports. Await the result for one page; iterate
   * it with `for await` for every report of every page. Each item is a
   * summary without `disclosures`; `get` reads a report with them.
   *
   * Needs the `read` scope. Operation `listCalculationReports`.
   *
   * @param calculationId - the calculation's id.
   */
  listForCalculation(
    calculationId: string,
    query?: ListCalculationReportsQuery,
    options?: RequestOptions,
  ): PagePromise<ReportSummary, ReportList> {
    return callPage(this.#config, "listCalculationReports", {
      path: { id: calculationId },
      query,
      options,
    });
  }

  /**
   * Reads a report.
   *
   * Needs the `read` scope. Operation `getReport`.
   */
  get(id: string, options?: RequestOptions): Promise<ReportWithPreview> {
    return call(this.#config, "getReport", { path: { id }, options });
  }

  /**
   * Edits a report with a merge patch: a member left out keeps its value,
   * `null` clears it, and any other value sets it. An array, such as
   * `disclosures`, replaces the stored one whole.
   *
   * Never retried.
   *
   * Needs the `write` scope. Operation `updateReport`.
   */
  update(
    id: string,
    patch: ReportPatch,
    options?: RequestOptions,
  ): Promise<Report> {
    return call(this.#config, "updateReport", {
      path: { id },
      body: patch,
      options,
    });
  }

  /**
   * Deletes an unshared report. A shared report cannot be deleted; revoke
   * its link instead.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteReport`.
   */
  delete(id: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteReport", { path: { id }, options });
  }

  /**
   * Shares a report: mints its share token and seals the report against
   * edits. Anyone holding the token can read the report, so handle it like
   * a secret.
   *
   * Needs a session token: sharing is a human trust step. An API key is
   * refused with `403` `session_required`, as an `ApiError`. Never retried.
   *
   * Operation `shareReport`.
   */
  share(id: string, options?: RequestOptions): Promise<Report> {
    return call(this.#config, "shareReport", { path: { id }, options });
  }

  /**
   * Revokes a report's link: its share token stops working.
   *
   * Needs a session token: it undoes a human trust step. An API key is
   * refused with `403` `session_required`, as an `ApiError`. Never retried.
   *
   * Operation `revokeReport`.
   */
  revoke(id: string, options?: RequestOptions): Promise<Report> {
    return call(this.#config, "revokeReport", { path: { id }, options });
  }
}
