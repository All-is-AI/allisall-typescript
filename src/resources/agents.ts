// The `agents` operations.

import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Agent,
  AgentCreate,
  AgentDetail,
  AgentList,
  AgentListItem,
  AgentPatch,
  GetAgentQuery,
  ListAgentsQuery,
} from "../types.js";

/** The `agents` operations. */
export class Agents {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists agents. Await the result for one page; iterate it with
   * `for await` for every agent of every page.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listAgents`.
   */
  list(
    query?: ListAgentsQuery,
    options?: RequestOptions,
  ): PagePromise<AgentListItem, AgentList> {
    return callPage(this.#config, "listAgents", { query, options });
  }

  /**
   * Creates an agent.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second agent.
   *
   * Needs the `write` scope. Operation `createAgent`.
   */
  create(
    body: AgentCreate,
    options?: IdempotentRequestOptions,
  ): Promise<Agent> {
    return call(this.#config, "createAgent", { body, options });
  }

  /**
   * Reads an agent, with its statistics. `from` and `to` bound the
   * statistics only; absent bounds mean all time.
   *
   * Needs the `read` scope. Operation `getAgent`.
   */
  get(
    id: string,
    query?: GetAgentQuery,
    options?: RequestOptions,
  ): Promise<AgentDetail> {
    return call(this.#config, "getAgent", { path: { id }, query, options });
  }

  /**
   * Updates an agent with a merge patch: a member left out keeps its value,
   * `null` clears it, and any other value sets it.
   *
   * Never retried.
   *
   * Needs the `write` scope. Operation `updateAgent`.
   */
  update(
    id: string,
    patch: AgentPatch,
    options?: RequestOptions,
  ): Promise<Agent> {
    return call(this.#config, "updateAgent", {
      path: { id },
      body: patch,
      options,
    });
  }

  /**
   * Deletes an agent. Refused while events reference the agent; set its
   * status to `retired` instead.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteAgent`.
   */
  delete(id: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteAgent", { path: { id }, options });
  }
}
