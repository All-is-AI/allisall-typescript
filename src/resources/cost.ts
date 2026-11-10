// The `cost` operations: cost line items and the price table.

import type { MoneyInput } from "../money.js";
import type { IdempotentRequestOptions, RequestOptions } from "../options.js";
import type { PagePromise } from "../pagination.js";
import { call, callPage } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  CostLineItem,
  CostLineItemCreate,
  CostLineItemList,
  CostLineItemPatch,
  ListCostLineItemsQuery,
  PriceTable,
  PriceTableSet,
} from "../types.js";

/** The `cost` operations. */
export class Cost {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Lists cost line items. Await the result for one page; iterate it with
   * `for await` for every line item of every page.
   *
   * Pass `page` for a numbered page: its `body` then holds `page` and
   * `total`. Only that first page is counted; every later page of a walk
   * continues by cursor from it, and its `page` and `total` are `null`. To
   * show another numbered page, call this method again with its `page`
   * rather than `getNextPage()`. A `page` past the end has no items, and the
   * walk ends there.
   *
   * Needs the `read` scope. Operation `listCostLineItems`.
   */
  listLineItems(
    query?: ListCostLineItemsQuery,
    options?: RequestOptions,
  ): PagePromise<CostLineItem, CostLineItemList> {
    return callPage(this.#config, "listCostLineItems", { query, options });
  }

  /**
   * Creates a cost line item. `monthly_amount` takes a `Decimal` or a
   * `number`.
   *
   * Every attempt of the call sends one `Idempotency-Key`, so a retry
   * cannot create a second line item.
   *
   * Needs the `write` scope. Operation `createCostLineItem`.
   */
  createLineItem(
    body: MoneyInput<CostLineItemCreate>,
    options?: IdempotentRequestOptions,
  ): Promise<CostLineItem> {
    return call(this.#config, "createCostLineItem", { body, options });
  }

  /**
   * Reads a cost line item.
   *
   * Needs the `read` scope. Operation `getCostLineItem`.
   */
  getLineItem(id: string, options?: RequestOptions): Promise<CostLineItem> {
    return call(this.#config, "getCostLineItem", { path: { id }, options });
  }

  /**
   * Updates a cost line item with a merge patch: a member left out keeps
   * its value, `null` clears it, and any other value sets it.
   * `monthly_amount` takes a `Decimal` or a `number`.
   *
   * Never retried.
   *
   * Needs the `write` scope. Operation `updateCostLineItem`.
   */
  updateLineItem(
    id: string,
    patch: MoneyInput<CostLineItemPatch>,
    options?: RequestOptions,
  ): Promise<CostLineItem> {
    return call(this.#config, "updateCostLineItem", {
      path: { id },
      body: patch,
      options,
    });
  }

  /**
   * Deletes a cost line item.
   *
   * A retry after a lost response can answer `404` for a delete that
   * succeeded.
   *
   * Needs the `write` scope. Operation `deleteCostLineItem`.
   */
  deleteLineItem(id: string, options?: RequestOptions): Promise<void> {
    return call(this.#config, "deleteCostLineItem", {
      path: { id },
      options,
    });
  }

  /**
   * Reads the price table.
   *
   * Needs the `read` scope. Operation `getPriceTable`.
   */
  getPriceTable(options?: RequestOptions): Promise<PriceTable> {
    return call(this.#config, "getPriceTable", { options });
  }

  /**
   * Replaces the price table, as a whole. Each rate takes a `Decimal` or a
   * `number`, so a table read with `getPriceTable` can be sent back as it
   * is.
   *
   * Retried on a failure worth retrying, because a repeat leaves the same
   * price table.
   *
   * Needs the `write` scope. Operation `setPriceTable`.
   */
  setPriceTable(
    body: MoneyInput<PriceTableSet>,
    options?: RequestOptions,
  ): Promise<PriceTable> {
    return call(this.#config, "setPriceTable", { body, options });
  }
}
