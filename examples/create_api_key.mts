import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

try {
  const key = await client.apiKeys.create({
    name: "production ingest",
    scopes: ["ingest"],
  });
  console.log(`created key ${key.name} (${key.prefix})`);
  // The token is returned this once, and no later call returns it. It is
  // printed here once for you to copy into your secret store. A service
  // passes it straight to its secret store and never logs it.
  console.log(key.token);
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
