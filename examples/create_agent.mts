import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second agent.
  const agent = await client.agents.create({
    agent_key: "support-bot",
    name: "Support bot",
    framework: "LangGraph",
    version: "1.4.0",
    status: "active",
  });
  console.log(`created agent ${agent.id} (${agent.agent_key})`);
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
