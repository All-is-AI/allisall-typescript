import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

// Replace REPORT_ID with the id of one of your reports.
const reportId = "REPORT_ID";

try {
  // report.share_token opens the shared report. Anyone holding it can read
  // the report, so handle it like a secret.
  const report = await client.reports.share(reportId);
  console.log(`report ${report.id} shared at ${report.shared_at}`);
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
