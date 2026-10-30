# @allisall/sdk

The allisall SDK for TypeScript and JavaScript. Version 0.1 sends events to
the allisall API. It runs on Node 22 and later, and in current browsers.

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
rejected event is listed in `summary.errors`, and the others are still
stored. Write `cost` with `decimal()` to keep it exact.

### Set your own `event_id` for at-least-once delivery

The SDK gives every event without an `event_id` a new one. That makes a
retry within one call safe, but it does not catch the same event sent
again in a later call. If your events can be delivered more than once,
for example from a queue that redelivers messages, set `event_id`
yourself, such as to the message's id. The API then stores the event
once, however often it arrives.

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

## Documentation

See [https://docs.allisai.ai](https://docs.allisai.ai).

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
