import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The latest arrivals, newest first.
  const latest = await client.events.listArrivals({ limit: 20 });
  for (const event of latest.data) {
    console.log(`${event.created_at} ${event.event_type}`);
  }
  // Later, ask how many arrived since: send the previous as_of as since.
  const since = await client.events.listArrivals({
    since: latest.body.as_of,
    limit: 1,
  });
  console.log(`${since.body.count} new events`);
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
