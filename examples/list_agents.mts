import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // Every agent in the workspace, page by page.
  for await (const agent of client.agents.list()) {
    console.log(
      `${agent.agent_key} ${agent.name}: assigned to ${agent.client_count} clients`,
    );
  }
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
