import {
  Allisall,
  ApiError,
  type EventInput,
  IngestError,
} from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

const event: EventInput = {
  // A fixed id: run the program again and the API counts a duplicate.
  event_id: "quickstart-ts-1",
  timestamp: new Date(),
  agent_key: "quickstart-agent",
  category: "session",
  event_type: "session_started",
};

const summary = await client.events.ingest([event]).catch((error: unknown) => {
  // The API refused the batch, for example an unknown key.
  if (error instanceof IngestError && error.cause instanceof ApiError) {
    const { status, code, requestId } = error.cause;
    throw new Error(
      `the API refused the batch: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
});

console.log(
  `accepted ${summary.accepted}, duplicates ${summary.duplicates}, rejected ${summary.rejected}`,
);
for (const row of summary.errors) {
  console.log(
    `event ${row.index}: ${row.code} at ${row.pointer}: ${row.detail}`,
  );
}
