import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The client's return on investment for August 2026.
  const result = await client.analytics.getRoiForClient(clientId, {
    from: "2026-08-01T00:00:00Z",
    to: "2026-09-01T00:00:00Z",
  });
  const { roi, undefined_reason } = result.ratios;
  console.log(
    roi === null ? `ROI undefined: ${undefined_reason}` : `ROI: ${roi}`,
  );
  console.log(
    `value ${result.value.total ?? "none"}, cost ${result.cost.total} ${result.currency}`,
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
