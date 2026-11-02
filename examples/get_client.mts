import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  const detail = await client.clients.get(clientId);
  console.log(`${detail.name} (${detail.status})`);
  for (const agent of detail.agents) {
    console.log(`assigned agent ${agent.agent_key}: ${agent.name}`);
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
