// The `valueModels` operations: value models, read by their own id or
// through the client they belong to, and value templates.

import type { MoneyInput } from "../money.js";
import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  ListValueModelsQuery,
  ListValueTemplatesQuery,
  ValueLineItemsSet,
  ValueModel,
  ValueModelCreate,
  ValueModelList,
  ValueModelPatch,
  ValueModelSummary,
  ValueTemplate,
  ValueTemplateList,
} from "../types.js";

/** The `valueModels` operations. */
export class ValueModels {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists value models. Await the result for one page; iterate it with
   * `for await` for every value model of every page.
   *
   * Needs the `read` scope. Operation `listValueModels`.
   */
  list(
    query?: ListValueModelsQuery,
    options?: RequestOptions,
  ): PagePromise<ValueModelSummary, ValueModelList> {
    return callPage(this.#config, "listValueModels", { query, options });
  }

  /**
   * Reads a value model by its own id: any model in the workspace,
   * archived ones included.
   *
   * Needs the `read` scope. Operation `getValueModel`.
   *
   * @param id - the value model's id, not its client's.
   */
  get(id: string, options?: RequestOptions): Promise<ValueModel> {
    return call(this.#config, "getValueModel", { path: { id }, options });
  }

  /**
   * Reads a client's active value model.
   *
   * Needs the `read` scope. Operation `getClientValueModel`.
   *
   * @param clientId - the client's id.
   */
  getForClient(
    clientId: string,
    options?: RequestOptions,
  ): Promise<ValueModel> {
    return call(this.#config, "getClientValueModel", {
      path: { id: clientId },
      options,
    });
  }

  /**
   * Creates a client's value model.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second value model.
   *
   * Needs the `write` scope. Operation `createValueModel`.
   *
   * @param clientId - the client's id.
   */
  createForClient(
    clientId: string,
    body: ValueModelCreate,
    options?: IdempotentRequestOptions,
  ): Promise<ValueModel> {
    return call(this.#config, "createValueModel", {
      path: { id: clientId },
      body,
      options,
    });
  }

  /**
   * Updates a client's active value model with a merge patch: a member
   * left out keeps its value, `null` clears it, and any other value sets
   * it.
   *
   * Never retried.
   *
   * Needs the `write` scope. Operation `updateValueModel`.
   *
   * @param clientId - the client's id.
   */
  updateForClient(
    clientId: string,
    patch: ValueModelPatch,
    options?: RequestOptions,
  ): Promise<ValueModel> {
    return call(this.#config, "updateValueModel", {
      path: { id: clientId },
      body: patch,
      options,
    });
  }

  /**
   * Deletes a client's active value model.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteValueModel`.
   *
   * @param clientId - the client's id.
   */
  deleteForClient(clientId: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteValueModel", {
      path: { id: clientId },
      options,
    });
  }

  /**
   * Replaces the line items of a client's active value model, as a whole
   * set. It is guarded by `version`: a stale version is refused rather
   * than overwriting a co-editor's change.
   *
   * Each `unit_value` takes a `Decimal` or a `number`.
   *
   * Never retried, because the `version` guard refuses a repeat of a write
   * that already landed as a stale version. On a `ConnectionError` the
   * write may have landed: read the value model again for its current
   * `version` before trying again.
   *
   * Needs the `write` scope. Operation `setValueModelLineItems`.
   *
   * @param clientId - the client's id.
   */
  setLineItemsForClient(
    clientId: string,
    body: MoneyInput<ValueLineItemsSet>,
    options?: RequestOptions,
  ): Promise<ValueModel> {
    return call(this.#config, "setValueModelLineItems", {
      path: { id: clientId },
      body,
      options,
    });
  }

  /**
   * Lists value templates. Await the result for one page; iterate it with
   * `for await` for every template of every page.
   *
   * Needs the `read` scope. Operation `listValueTemplates`.
   */
  listTemplates(
    query?: ListValueTemplatesQuery,
    options?: RequestOptions,
  ): PagePromise<ValueTemplate, ValueTemplateList> {
    return callPage(this.#config, "listValueTemplates", { query, options });
  }
}
