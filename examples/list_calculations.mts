import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // Every published calculation in the workspace, page by page.
  for await (const item of client.calculations.list({ state: "published" })) {
    console.log(
      `${item.client_name} ${item.period.from} to ${item.period.to}: ${item.coverage_findings} coverage findings`,
    );
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
