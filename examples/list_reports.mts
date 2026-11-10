import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // Every report in the workspace, newest first, page by page.
  for await (const report of client.reports.list()) {
    console.log(
      `${report.id} for ${report.client_name}, ${report.period.from} to ${report.period.to}: ${report.state}`,
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
