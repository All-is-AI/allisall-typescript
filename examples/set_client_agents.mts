import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";
// Replace AGENT_ID with the id of one of your agents.
const agentId = "AGENT_ID";

try {
  // The list replaces the client's assigned agents.
  const assigned = await client.clients.setAgents(clientId, {
    agent_ids: [agentId],
  });
  for (const agent of assigned.agents) {
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
