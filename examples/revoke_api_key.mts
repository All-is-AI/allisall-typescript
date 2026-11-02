import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

// Replace API_KEY_ID with the id of one of your API keys, not its token.
const apiKeyId = "API_KEY_ID";

try {
  // The key stops working at once.
  const key = await client.apiKeys.revoke(apiKeyId);
  console.log(`key ${key.name} revoked at ${key.revoked_at}`);
} catch (error) {
  // The API refused the request, for example an unknown id or an expired session.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
