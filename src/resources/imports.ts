// The `imports` operations: a CSV file of events, previewed or committed.

import type { ImportUpload } from "../multipart.js";
import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import { call } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type { ImportPreview, ImportResult } from "../types.js";

/** The `imports` operations. */
export class Imports {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
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
