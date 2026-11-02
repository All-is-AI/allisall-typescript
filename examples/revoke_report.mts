import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

// Replace REPORT_ID with the id of one of your reports.
const reportId = "REPORT_ID";

try {
  // The share token stops working at once.
  const report = await client.reports.revoke(reportId);
  console.log(`report ${report.id} revoked at ${report.revoked_at}`);
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
