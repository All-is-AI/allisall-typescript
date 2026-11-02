# @allisall/sdk

The allisall SDK for TypeScript and JavaScript: a typed client for the
allisall API, covering events, imports, clients, agents, value models,
costs, analytics, calculations, reports, the dashboard, API keys and
shared reports. It runs on Node 22 and later, and in Chrome 114, Firefox
135 and Safari 18.4 and later.

## Install

```sh
npm install @allisall/sdk
```

## Create a client

The client reads your API key from `AIA_API_KEY`:

```sh
export AIA_API_KEY=aia_...
```

```ts
import { Allisall } from "@allisall/sdk";

const client = new Allisall();
```

You can also pass the key yourself, as `new Allisall({ apiKey })`. Create
one client and reuse it.

## Ingest events

```ts
import { Allisall, decimal } from "@allisall/sdk";

const client = new Allisall();

const summary = await client.events.ingest([
  {
    timestamp: new Date(),
    agent_key: "support-bot",
    category: "model",
    event_type: "completion",
    model: "gpt-4o",
    tokens_in: 1200,
    tokens_out: 300,
    cost: decimal("0.0042"),
  },
]);

console.log(summary.accepted, summary.duplicates, summary.rejected);
```

`ingest` takes any number of events. It sends them in batches, retries a
failure worth retrying, and returns one summary for the whole list. A
rejected event is counted in `summary.rejected`, its problems are listed in
`summary.errors`, and the others are still stored. When
`summary.errors_truncated` is `true`, the list omits some problems, and a
rejected event may have no entry. Write `cost` with `decimal()` to keep it
exact.

### Set your own `event_id` for at-least-once delivery

The SDK gives every event without an `event_id` a new one. That makes a
retry within one call safe, but it does not catch the same event sent
again in a later call. If your events can be delivered more than once,
for example from a queue that redelivers messages, set `event_id`
yourself, such as to the message's id. The API then stores the event
once, however often it arrives.

## Call the API

The client groups its methods by resource: `client.clients`,
`client.agents`, `client.valueModels`, `client.cost`, `client.analytics`,
`client.calculations`, `client.reports`, `client.dashboard` and more. Each
method's documentation names the API operation it calls and the scope your
key needs.

```ts
import { Allisall } from "@allisall/sdk";

const client = new Allisall();

const created = await client.clients.create({
  name: "Acme Logistics",
  status: "active",
  client_key: "acme",
});

// An update is a merge patch: a member you leave out keeps its value, and
// null clears it.
const updated = await client.clients.update(created.id, {
  renewal_date: "2026-12-31",
});
console.log(updated.name, updated.renewal_date);
```

A call that creates something other than an API key sends an
`Idempotency-Key`, and sends the same key again on a retry, so a retry
never creates a second one. Amounts
of money come back as a `Decimal`, a string holding the exact amount.

## Lists

A list method returns every item of every page when you iterate it with
`for await`. The SDK fetches each page as the loop reaches it:

```ts
import { Allisall } from "@allisall/sdk";

const client = new Allisall();

for await (const agent of client.agents.list()) {
  console.log(agent.agent_key, agent.name);
}
```

To work a page at a time, await the call instead. The page holds its items
in `data`, and `hasNextPage()` and `getNextPage()` move through the rest:

```ts
import { Allisall } from "@allisall/sdk";

const client = new Allisall();

const page = await client.agents.list({ limit: 50 });
console.log(page.data.length, page.hasNextPage());
```

## Errors

Every error from the API or the network is an `AllisallError`. An error
response from the API is an `ApiError`, with the HTTP `status`, the API's
error `code` and the `requestId` to quote when you report a problem.
Branch on `code`:

```ts
import { Allisall, ApiError } from "@allisall/sdk";

const client = new Allisall();

try {
  await client.clients.delete("CLIENT_ID");
} catch (error) {
  if (error instanceof ApiError && error.code === "client_has_events") {
    // Events carry the client's key, so mark the client churned instead.
    await client.clients.update("CLIENT_ID", { status: "churned" });
  } else {
    throw error;
  }
}
```

A `ConnectionError` means no response arrived, after any retries. A few
errors are not an `AllisallError`. An argument the SDK cannot send, such
as an invalid `Date`, throws a `TypeError` before anything is sent. An
error thrown by your `tokenProvider` reaches you unchanged. A call you
abort with `signal` rejects with the signal's reason.

The SDK retries a failure worth retrying, twice by default; set
`maxRetries` on the client or on one call to change that. It retries only
a request that cannot take effect twice: a `GET`, `PUT` or `DELETE`;
ingest, whose event ids deduplicate; and a call that carries an
`Idempotency-Key`. The SDK sends that key, the same on every attempt,
when it creates anything but an API key and when it commits an import. A
`PATCH`, the calculation and report actions (validate, publish, reopen,
share and revoke), revoking or creating an API key, an import preview,
and setting a value model's line items are never retried. Setting line
items is guarded by the model's `version`, which refuses a repeat of a
write that already landed.

## Sessions

Some operations record a person's decision, such as publishing a
calculation, sharing a report, or managing API keys. They take a signed-in
user's session token, and refuse any API key with `403`
`session_required`. Pass a `tokenProvider` that returns the current token.
The client calls it before every attempt, so a refreshed token is picked
up:

```ts
import { Allisall } from "@allisall/sdk";

// Your sign-in library's way to read the signed-in user's session token.
declare function currentSessionToken(): Promise<string>;

const client = new Allisall({ tokenProvider: currentSessionToken });

const calculation = await client.calculations.publish("CALCULATION_ID");
console.log(calculation.state);
```

`getSharedReport(shareToken)` reads a shared report with its share token.
It is a function rather than a client method, because it needs no API key
and no session.

## Browsers

An API key in a browser can be read by anyone who loads the page. The
client therefore refuses an API key in a browser unless you pass
`dangerouslyAllowBrowser: true`:

```ts
import { Allisall } from "@allisall/sdk";

// Only if you accept that anyone who loads the page can read this key.
const client = new Allisall({
  apiKey: "aia_...",
  dangerouslyAllowBrowser: true,
});
```

Prefer calling the API from your server.

The SDK supports Chrome 114, Firefox 135 and Safari 18.4 and later. They are
the first releases that read and write JSON numbers exactly, which the SDK
needs for amounts of money. In an older browser, a call that sends a
`Decimal` or receives an amount fails with an `AllisallError` that names
the missing feature.

## Documentation

See [https://docs.allisai.ai](https://docs.allisai.ai).

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
