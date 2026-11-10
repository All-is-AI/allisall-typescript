// The `events` operations: ingest, the workspace's events, their summary
// and arrivals, and the event drill-down.

import { OPERATIONS } from "../generated/operations.js";
import { ingest, readIngestResult } from "../ingest.js";
import type { RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage, policyOf } from "../request.js";
import { type CallPolicy, post, type TransportConfig } from "../transport.js";
import type {
  AttributedEvent,
  ClientEventList,
  EventArrivalList,
  EventInput,
  EventList,
  EventSummary,
  GetEventSummaryQuery,
  IngestSummary,
  ListClientEventsQuery,
  ListEventArrivalsQuery,
  ListEventsQuery,
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
   * Lists the workspace's events whose `timestamp` falls in the period,
   * newest first. Await the result for one page; iterate it with
   * `for await` for every event of every page.
   *
   * `from` and `to` are required unless `import_batch_id` is sent, and
   * then are both sent or neither; the API refuses a missing bound with
   * `required`. The type cannot say so, so both are optional in it.
   *
   * The list is held still under an arrival limit, `as_of`, which the first
   * response issues. A walk follows `next_cursor`, which carries it, so
   * every page of one walk reads the same events while new ones arrive. To
   * show numbered pages instead, send the first response's `as_of` with each
   * later `page`. Filtered by `import_batch_id`, `as_of` is issued but not
   * applied, because an import's events appear together when it commits.
   * Otherwise an event appears a second or two after the API stores it, and
   * later while a long request, such as a large import, is still in
   * progress, so a read straight after an ingest may not include it yet.
   *
   * Pass `page` for a numbered page: its `body` then holds `page`, `total`
   * and `total_capped`. `total` counts at most 10,000 events, and
   * `total_capped` is `true` when more matched; filtered by
   * `import_batch_id`, `total` is exact. Only that first page is counted;
   * every later page of a walk continues by cursor from it, and its `page`,
   * `total` and `total_capped` are `null`. To show another numbered page,
   * call this method again with its `page` rather than `getNextPage()`.
   *
   * `sort` and `dir` other than `timestamp` descending need `page`, or the
   * API refuses the call with `required` on `page`. A walk from a sorted
   * page continues by offset and reads every earlier row for each page, so
   * walk in the default order.
   *
   * Needs the `read` scope. Operation `listEvents`.
   */
  list(
    query?: ListEventsQuery,
    options?: RequestOptions,
  ): PagePromise<AttributedEvent, EventList> {
    return callPage(this.#config, "listEvents", { query, options });
  }

  /**
   * Counts the events `list` holds under the same period, filters and
   * `as_of`: in all, per day and per category. A day is 24 hours counted
   * from `from`, so local midnight with its offset as `from` gives local
   * days. The period is required, also with `import_batch_id`. Without
   * `import_batch_id`, an event is counted a second or two after the API
   * stores it, and later while a long request, such as a large import, is
   * still in progress, so a read straight after an ingest may not count it
   * yet.
   *
   * Needs the `read` scope. Operation `getEventSummary`.
   */
  getSummary(
    query: GetEventSummaryQuery,
    options?: RequestOptions,
  ): Promise<EventSummary> {
    return call(this.#config, "getEventSummary", { query, options });
  }

  /**
   * Lists the workspace's events in the order the API stored them, newest
   * first, below an arrival limit, `as_of`, which the response issues.
   * Await the result for one page; iterate it with `for await` for every
   * event of every page. `from` and `to` filter by `timestamp`, and each is
   * optional on its own.
   *
   * With `since`, the list holds the events that arrived at or after it, and
   * `body.count` counts them. To poll, send each response's `as_of` as the
   * next call's `since` and walk the result: consecutive windows meet
   * without a gap or an overlap. To learn only how many arrived, pass a
   * `limit` of 1 and read `body.count`. The SDK does not poll on its own.
   * `since` may be at most 24 hours back; a feed further behind reloads
   * without it. An event falls below `as_of` a second or two after the API
   * stores it, and later while a long request, such as a large import, is
   * still in progress. A read straight after an ingest may not include it
   * yet; poll with `since` until it does.
   *
   * Needs the `read` scope. Operation `listEventArrivals`.
   */
  listArrivals(
    query?: ListEventArrivalsQuery,
    options?: RequestOptions,
  ): PagePromise<AttributedEvent, EventArrivalList> {
    return callPage(this.#config, "listEventArrivals", { query, options });
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
