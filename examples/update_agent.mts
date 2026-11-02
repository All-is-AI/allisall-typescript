import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace AGENT_ID with the id of one of your agents.
const agentId = "AGENT_ID";

try {
  // A member left out keeps its value; null clears it.
  const agent = await client.agents.update(agentId, { status: "retired" });
  console.log(`${agent.agent_key} is now ${agent.status}`);
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
