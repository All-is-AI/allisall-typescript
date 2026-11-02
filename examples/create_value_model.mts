import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second value model.
  const model = await client.valueModels.createForClient(clientId, {
    name: "Acme support value",
    template_id: "support-automation",
  });
  console.log(
    `created value model ${model.id} with ${model.line_items.length} line items`,
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
