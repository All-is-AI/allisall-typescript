import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The value the client's outcomes produced in August 2026.
  const value = await client.analytics.getValueForClient(clientId, {
    from: "2026-08-01T00:00:00Z",
    to: "2026-09-01T00:00:00Z",
  });
  console.log(`value: ${value.total ?? "none"} ${value.currency}`);
  for (const line of value.lines) {
    console.log(
      `${line.label}: ${line.quantity} at ${line.unit_value}, ${line.total} ${value.currency}`,
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
