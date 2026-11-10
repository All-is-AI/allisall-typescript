import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // Every event of August 2026 in the workspace, newest first, page by page.
  // Every page reads the same events, however many arrive meanwhile.
  for await (const event of client.events.list({
    from: "2026-08-01T00:00:00Z",
    to: "2026-09-01T00:00:00Z",
  })) {
    console.log(
      `${event.timestamp} ${event.event_type} for ${event.client_name ?? "no client"}`,
    );
  }
} catch (error) {
  // The API refused the request, for example a key without the read scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
