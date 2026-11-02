import { Allisall, ApiError, decimal } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second line item.
  const item = await client.cost.createLineItem({
    label: "Hosting",
    target: { kind: "client", id: clientId },
    monthly_amount: decimal("30000"),
    start_date: "2026-07-01",
  });
  console.log(
    `created cost line item ${item.id}: ${item.monthly_amount} ${item.currency} a month`,
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
