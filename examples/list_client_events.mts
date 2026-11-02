import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // Every event attributed to the client in August 2026, page by page.
  const events = client.events.listForClient(clientId, {
    from: "2026-08-01T00:00:00Z",
    to: "2026-09-01T00:00:00Z",
  });
  for await (const event of events) {
    console.log(
      `${event.timestamp} ${event.agent_name}: ${event.category} ${event.event_type}`,
    );
  }
} catch (error) {
  // The API refused the request, for example an unknown id.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
