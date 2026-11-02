import { ApiError, getSharedReport } from "@allisall/sdk";

// Reads the report's share token from AIA_SHARE_TOKEN. Anyone holding it
// can read the report, so handle it like a secret.
const shareToken = process.env.AIA_SHARE_TOKEN ?? "";

try {
  // Needs no API key and no session.
  const report = await getSharedReport(shareToken);
  console.log(`${report.client_name}, from ${report.workspace_name}`);
  console.log(
    `value ${report.snapshot.value.total ?? "none"} ${report.currency}, ROI ${report.snapshot.ratios.roi ?? "undefined"}`,
  );
} catch (error) {
  // Every failure, an unknown or revoked token included, is the same 404.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
