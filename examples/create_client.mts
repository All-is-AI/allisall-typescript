import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// A renewal date one calendar year after today's UTC date, as YYYY-MM-DD.
// A date before yesterday in UTC is refused.
const renewal = new Date();
renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second client.
  const created = await client.clients.create({
    name: "Acme Logistics",
    status: "active",
    client_key: "acme",
    renewal_date: renewal.toISOString().slice(0, 10),
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
