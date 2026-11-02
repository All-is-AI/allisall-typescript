import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  const model = await client.valueModels.getForClient(clientId);
  console.log(`${model.name}, version ${model.version} (${model.status})`);
  for (const item of model.line_items) {
    console.log(
      `${item.outcome_type}: ${item.unit_value} ${model.currency} each, ${item.label}`,
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
