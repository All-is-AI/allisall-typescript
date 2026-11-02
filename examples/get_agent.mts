import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace AGENT_ID with the id of one of your agents.
const agentId = "AGENT_ID";

try {
  const agent = await client.agents.get(agentId);
  console.log(`${agent.agent_key} ${agent.name} (${agent.status})`);
  console.log(
    `${agent.stats.events} events, costing ${agent.stats.cost_total} ${agent.stats.currency}`,
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
