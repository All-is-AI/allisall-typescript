// A list call's result: a page, and the walk over every following page.

import { AllisallError } from "./errors.js";
import type { RequestOptions } from "./options.js";

/** The envelope every list response shares. */
export interface ListBody {
  readonly data: readonly unknown[];
  readonly has_more: boolean;
  readonly next_cursor: string | null;
}

/** Fetches the page after this one; the options apply to that request alone. */
type NextPage<Item, Body extends ListBody> = (
  options: RequestOptions | undefined,
) => Promise<Page<Item, Body>>;

/**
 * One page of a list. `data` holds its items and `body` the whole response,
 * such as the event drill-down's `total`. Iterate it with `for await` to
 * walk its items and then every following page's.
 */
export class Page<Item, Body extends ListBody> implements AsyncIterable<Item> {
  /** The page's items. */
  readonly data: Item[];
  /** The whole decoded response. */
  readonly body: Body;
  readonly #next: NextPage<Item, Body> | undefined;

  /** Pages are made by list methods; you do not construct one. */
  constructor(body: Body, next: NextPage<Item, Body> | undefined) {
    this.body = body;
    // The envelope was checked as an array of the list's items when the
    // response was read.
    this.data = body.data as Item[];
    this.#next = next;
  }

  /** Whether another page follows this one: the response's `has_more`. */
  hasNextPage(): boolean {
    return this.#next !== undefined;
  }

  /**
   * Fetches the next page, with the same query and options as this one.
   * `options` apply to this request alone, over the call's.
   *
   * @throws {AllisallError} when this is the last page.
   */
  getNextPage(options?: RequestOptions): Promise<Page<Item, Body>> {
    if (this.#next === undefined) {
      return Promise.reject(
        new AllisallError(
          "allisall: this is the last page; no page follows it",
        ),
      );
    }
    return this.#next(options);
  }

  /** Yields this page's items, then each following page's, fetching each page as it is reached. */
  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    let page: Page<Item, Body> = this;
    for (;;) {
      yield* page.data;
      if (!page.hasNextPage()) return;
      page = await page.getNextPage();
    }
  }
}

/**
 * The result of a list method. Await it for the first `Page`; iterate it
 * with `for await` for every item of every page.
 *
 * Nothing is sent until it is awaited or iterated, so a list call whose
 * result is never used sends no request.
 */
export class PagePromise<Item, Body extends ListBody>
  implements PromiseLike<Page<Item, Body>>, AsyncIterable<Item>
{
  readonly #load: () => Promise<Page<Item, Body>>;
  #first: Promise<Page<Item, Body>> | undefined;

  /** Made by list methods; you do not construct one. */
  constructor(load: () => Promise<Page<Item, Body>>) {
    this.#load = load;
  }

  /** The first page, requested once, on first use. */
  #page(): Promise<Page<Item, Body>> {
    this.#first ??= this.#load();
    return this.#first;
  }

  /** Resolves with the first page, sending its request on first use. */
  // biome-ignore lint/suspicious/noThenProperty: a PagePromise is awaitable by design, so it must have then.
  then<R1 = Page<Item, Body>, R2 = never>(
    onfulfilled?:
      | ((page: Page<Item, Body>) => R1 | PromiseLike<R1>)
      | null
      | undefined,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null | undefined,
  ): Promise<R1 | R2> {
    return this.#page().then(onfulfilled, onrejected);
  }

  /** As `Promise.prototype.catch`, on the first page. */
  catch<R = never>(
    onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null | undefined,
  ): Promise<Page<Item, Body> | R> {
    return this.#page().catch(onrejected);
  }

  /** As `Promise.prototype.finally`, on the first page. */
  finally(
    onfinally?: (() => void) | null | undefined,
  ): Promise<Page<Item, Body>> {
    return this.#page().finally(onfinally);
  }

  /** Yields every item of every page, from the first. */
  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    yield* await this.#page();
  }
}
