import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The portfolio for August 2026.
  const dashboard = await client.dashboard.get({ month: "2026-08" });
  console.log(
    `value ${dashboard.value_total}, cost ${dashboard.cost_total} ${dashboard.currency}`,
  );
  console.log(`ROI ${dashboard.ratios.roi ?? "undefined"}`);
  for (const item of dashboard.clients) {
    console.log(`${item.name}: ROI ${item.roi ?? "undefined"}`);
  }
  // The list holds at most 1,000 clients; the omitted count is the rest.
  console.log(`clients not listed: ${dashboard.clients_omitted}`);
  // The five counted clients with the highest value, whatever the sort.
  for (const item of dashboard.top_clients) {
    console.log(`top: ${item.name}, value ${item.value_total}`);
  }
} catch (error) {
  // The API refused the request, for example a key without the read scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
