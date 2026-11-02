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
