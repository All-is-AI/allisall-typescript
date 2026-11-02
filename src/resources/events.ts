// The `events` operations: ingest, and the event drill-down.

import { OPERATIONS } from "../generated/operations.js";
import { ingest, readIngestResult } from "../ingest.js";
import type { RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { callPage, policyOf } from "../request.js";
import { type CallPolicy, post, type TransportConfig } from "../transport.js";
import type {
  AttributedEvent,
  ClientEventList,
  EventInput,
  IngestSummary,
  ListClientEventsQuery,
} from "../types.js";

/** The `events` operations. */
export class Events {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Ingests any number of events. They are sent in batches of at most 500
   * events and 4,000,000 bytes, one batch after another, each retried as
   * the client allows. Every event without an `event_id` gets a generated
   * one, so a retry never stores an event twice. Your objects are not
   * modified.
   *
   * An event too large to send even alone is not sent, and is reported as a
   * rejected row with the code `too_large`.
   *
   * @returns the combined outcome over the whole list.
   * @throws {IngestError} when a batch fails; the call stops there, and the
   * error carries the summary so far and every event from the failed batch
   * onward, to send again. A batch fails on an error response, on no
   * response, on the caller's cancellation, or when its token cannot be
   * had: an error from `tokenProvider`, or, in a browser without
   * `dangerouslyAllowBrowser`, a provider's token that is an API key. The
   * error is the `IngestError`'s `cause`.
   * @throws {TypeError} when an event cannot be encoded, or `options.headers`
   * names a header the SDK sets, before anything is sent.
   * @throws {AllisallError} when `options.timeout` or `options.maxRetries` is
   * one the client would refuse, before anything is sent.
   */
  ingest(
    events: readonly EventInput[],
    options: RequestOptions = {},
  ): Promise<IngestSummary> {
    const config = this.#config;
    let policy: CallPolicy;
    try {
      policy = policyOf(
        config,
        "ingestEvents",
        OPERATIONS.ingestEvents,
        options,
      );
    } catch (err) {
      return Promise.reject(err);
    }
    // Each batch has its own signal; ingest is always eligible for a retry,
    // because event_id deduplicates, which post() sets.
    const { timeout, maxRetries, headers } = policy;
    return ingest(
      events,
      (body, count, signal) =>
        post(
          config,
          OPERATIONS.ingestEvents.path,
          body,
          (value) => readIngestResult(value, count),
          { timeout, maxRetries, headers, signal },
        ),
      options.signal,
    );
  }

  /**
   * Lists the events behind a client's totals: the event drill-down, over
   * the period `from` to `to`.
   *
   * Pass `page` or `cursor`, not both; neither means page 1. A `page`
   * beyond the end returns no rows and the true `total`. Await the result
   * for one page, whose `body` holds `total` and `period`; iterate it with
   * `for await` for every event of every page from there.
   *
   * Needs the `read` scope. Operation `listClientEvents`.
   *
   * @param clientId - the client's id.
   */
  listForClient(
    clientId: string,
    query: ListClientEventsQuery,
    options?: RequestOptions,
  ): PagePromise<AttributedEvent, ClientEventList> {
    return callPage(this.#config, "listClientEvents", {
      path: { id: clientId },
      query,
      options,
    });
  }
}
