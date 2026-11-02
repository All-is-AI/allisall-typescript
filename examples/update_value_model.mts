import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // A member left out keeps its value.
  const model = await client.valueModels.updateForClient(clientId, {
    status: "archived",
  });
  console.log(`${model.name} is now ${model.status}`);
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
