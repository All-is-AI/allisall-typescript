import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second calculation.
  const calculation = await client.calculations.createForClient(clientId, {
    period: { from: "2026-08-01T00:00:00Z", to: "2026-09-01T00:00:00Z" },
  });
  console.log(`calculation ${calculation.id} (${calculation.state})`);
  console.log(
    `value ${calculation.value_total ?? "none"}, cost ${calculation.cost_total} ${calculation.currency}`,
  );
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
