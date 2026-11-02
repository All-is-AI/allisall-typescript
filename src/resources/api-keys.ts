// The `apiKeys` operations: a workspace's API keys, managed with a
// session token.

import type { RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  ApiKey,
  ApiKeyCreate,
  ApiKeyList,
  ApiKeyWithToken,
  ListApiKeysQuery,
} from "../types.js";

/** The `apiKeys` operations. */
export class ApiKeys {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Creates an API key, and returns its complete token once. Store the
   * token at once: no later call returns it, because the API keeps only a
   * hash.
   *
   * Never retried, because a retried create would make a second key. On a
   * `ConnectionError`, list the keys to learn whether it was created.
   *
   * Needs a session token: an API key cannot create a key. An API key is
   * refused with `403` `session_required`, as an `ApiError`.
   *
   * Operation `createApiKey`.
   */
  create(
    body: ApiKeyCreate,
    options?: RequestOptions,
  ): Promise<ApiKeyWithToken> {
    return call(this.#config, "createApiKey", { body, options });
  }

  /**
   * Lists API keys. Await the result for one page; iterate it with
   * `for await` for every key of every page.
   *
   * Needs a session token. An API key is refused with `403`
   * `session_required`, as an `ApiError`.
   *
   * Operation `listApiKeys`.
   */
  list(
    query?: ListApiKeysQuery,
    options?: RequestOptions,
  ): PagePromise<ApiKey, ApiKeyList> {
    return callPage(this.#config, "listApiKeys", { query, options });
  }

  /**
   * Reads an API key. Its token is never returned.
   *
   * Needs a session token. An API key is refused with `403`
   * `session_required`, as an `ApiError`.
   *
   * Operation `getApiKey`.
   */
  get(id: string, options?: RequestOptions): Promise<ApiKey> {
    return call(this.#config, "getApiKey", { path: { id }, options });
  }

  /**
   * Revokes an API key. The next request bearing the key is refused with
   * `401`.
   *
   * Needs a session token. An API key is refused with `403`
   * `session_required`, as an `ApiError`. Never retried.
   *
   * Operation `revokeApiKey`.
   *
   * @param id - the key's `id`, not its token.
   */
  revoke(id: string, options?: RequestOptions): Promise<ApiKey> {
    return call(this.#config, "revokeApiKey", { path: { id }, options });
  }
}
