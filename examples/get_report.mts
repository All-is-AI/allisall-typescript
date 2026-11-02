import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace REPORT_ID with the id of one of your reports.
const reportId = "REPORT_ID";

try {
  const report = await client.reports.get(reportId);
  console.log(
    `report for ${report.client_name}: shared ${report.shared_at ?? "never"}`,
  );
  for (const disclosure of report.disclosures) {
    console.log(
      `${disclosure.kind}: ${disclosure.included ? "included" : "left out"}`,
    );
  }
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
