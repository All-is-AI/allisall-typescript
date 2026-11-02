import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

try {
  // Every API key in the workspace, page by page. A key's token is never
  // returned.
  for await (const key of client.apiKeys.list()) {
    console.log(
      `${key.name} (${key.prefix}): ${key.scopes.join(", ")}, last used ${key.last_used_at ?? "never"}`,
    );
  }
} catch (error) {
  // The API refused the request, for example an expired session.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
