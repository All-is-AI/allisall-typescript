import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY. The health check itself sends no
// credential.
const client = new Allisall();

try {
  const health = await client.health.get();
  console.log(`${health.status}, version ${health.version}`);
} catch (error) {
  // The API refused the request, for example while the service is unavailable.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
