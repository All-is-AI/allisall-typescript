import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // What looks unusual in the client's events for August 2026.
  const anomalies = await client.analytics.getAnomaliesForClient(clientId, {
    from: "2026-08-01T00:00:00Z",
    to: "2026-09-01T00:00:00Z",
  });
  console.log(`days without outcomes: ${anomalies.zero_outcome_days.length}`);
  console.log(`cost spikes: ${anomalies.cost_spikes.length}`);
  // The list holds at most 100 outcome types; the omitted count is the rest.
  const unmapped =
    anomalies.unmapped_outcome_types.length +
    anomalies.unmapped_outcome_types_omitted;
  console.log(`unmapped outcome types: ${unmapped}`);
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
