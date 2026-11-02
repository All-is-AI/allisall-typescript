import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second client.
  const created = await client.clients.create({
    name: "Acme Logistics",
    status: "active",
    client_key: "acme",
    renewal_date: "2026-12-31",
  });
  console.log(`created client ${created.id} (${created.name})`);
} catch (error) {
  // The API refused the request, for example a key without the write scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
