// The `clients` operations.

import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Client,
  ClientAgents,
  ClientAgentsSet,
  ClientCreate,
  ClientDetail,
  ClientList,
  ClientPatch,
  ListClientsQuery,
} from "../types.js";

/** The `clients` operations. */
export class Clients {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists clients. Await the result for one page; iterate it with
   * `for await` for every client of every page.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listClients`.
   */
  list(
    query?: ListClientsQuery,
    options?: RequestOptions,
  ): PagePromise<Client, ClientList> {
    return callPage(this.#config, "listClients", { query, options });
  }

  /**
   * Creates a client.
   *
   * A `renewal_date` before the request's UTC date less one day is refused
   * with `400` `out_of_range`, so no time zone's today is refused. With a
   * `renewal_term`, an active client's renewal date rolls forward by whole
   * terms once it passes.
   *
   * `client_key` is unique in the workspace, ignoring letter case and
   * surrounding whitespace: a key another client already holds, in any
   * case or padding, is refused with `409` `client_key_in_use`.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second client.
   *
   * Needs the `write` scope. Operation `createClient`.
   */
  create(
    body: ClientCreate,
    options?: IdempotentRequestOptions,
  ): Promise<Client> {
    return call(this.#config, "createClient", { body, options });
  }

  /**
   * Reads a client.
   *
   * Needs the `read` scope. Operation `getClient`.
   */
  get(id: string, options?: RequestOptions): Promise<ClientDetail> {
    return call(this.#config, "getClient", { path: { id }, options });
  }

  /**
   * Updates a client with a merge patch: a member left out keeps its
   * value, `null` clears it, and any other value sets it.
   *
   * Sending back the `renewal_date` a read returned keeps the client's
   * renewal schedule: a date on the schedule, up to the one it shows on the
   * next UTC day, changes nothing. Any other date is a new renewal date, and
   * one before the request's UTC date less one day is refused with `400`
   * `out_of_range`. A patch that changes `renewal_term` or `status` saves
   * the date the client shows on the current UTC day as the new start of
   * its schedule, without the patch sending a date.
   *
   * `client_key` is unique in the workspace, ignoring letter case and
   * surrounding whitespace: a key another client already holds, in any
   * case or padding, is refused with `409` `client_key_in_use`.
   *
   * Never retried.
   *
   * Needs the `write` scope. Operation `updateClient`.
   */
  update(
    id: string,
    patch: ClientPatch,
    options?: RequestOptions,
  ): Promise<Client> {
    return call(this.#config, "updateClient", {
      path: { id },
      body: patch,
      options,
    });
  }

  /**
   * Deletes a client. Refused while events carry the client's key, or
   * while the client has a validated or published calculation; set its
   * status to `churned` instead.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteClient`.
   */
  delete(id: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteClient", { path: { id }, options });
  }

  /**
   * Replaces a client's assigned agents. Assignment decides how later
   * events are attributed: an event without `client_key` from an agent
   * assigned to exactly one client is attributed to that client. A
   * `model` or `outcome` event from an agent assigned to two or more
   * clients must carry `client_key`, or it is refused with
   * `client_key_required`.
   *
   * Retried on a failure worth retrying, because a repeat leaves the same
   * agents assigned.
   *
   * Needs the `write` scope. Operation `setClientAgents`.
   */
  setAgents(
    id: string,
    body: ClientAgentsSet,
    options?: RequestOptions,
  ): Promise<ClientAgents> {
    return call(this.#config, "setClientAgents", {
      path: { id },
      body,
      options,
    });
  }
}
