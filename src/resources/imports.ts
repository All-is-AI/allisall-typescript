// The `imports` operations: a CSV file of events, previewed or committed.

import type { ImportUpload } from "../multipart.js";
import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Import,
  ImportList,
  ImportPreview,
  ImportResult,
  ImportSummary,
  ListImportsQuery,
} from "../types.js";

/** The `imports` operations. */
export class Imports {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists the workspace's imports, newest first, each with its counts.
   * Await the result for one page; iterate it with `for await` for every
   * import of every page.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listImports`.
   */
  list(
    query?: ListImportsQuery,
    options?: RequestOptions,
  ): PagePromise<ImportSummary, ImportList> {
    return callPage(this.#config, "listImports", { query, options });
  }

  /**
   * Reads an import, with the mapping it ran with. Pass that mapping to
   * `toImportMapping` to send it as the next import's mapping.
   *
   * Needs the `read` scope. Operation `getImport`.
   */
  get(id: string, options?: RequestOptions): Promise<Import> {
    return call(this.#config, "getImport", { path: { id }, options });
  }

  /**
   * Previews a CSV import: parses, maps and validates the file exactly as
   * `commit` would, and writes nothing.
   *
   * Never retried, although it writes nothing; repeat the call to try
   * again.
   *
   * Needs the `ingest` scope. Operation `previewImport`.
   */
  preview(
    upload: ImportUpload,
    options?: RequestOptions,
  ): Promise<ImportPreview> {
    return call(this.#config, "previewImport", { body: upload, options });
  }

  /**
   * Imports a CSV file: stores its valid rows and records an import batch.
   * A problem with one row rejects that row only. The result lists the
   * problems of the rejected rows, one `errors` entry per problem, up to the
   * first 1,000; `errors_truncated` says when more were omitted, and the
   * counts always cover the whole file. Events deduplicate as they do on
   * ingest.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot record a second import batch.
   *
   * Needs the `ingest` scope. Operation `commitImport`.
   */
  commit(
    upload: ImportUpload,
    options?: IdempotentRequestOptions,
  ): Promise<ImportResult> {
    return call(this.#config, "commitImport", { body: upload, options });
  }
}
