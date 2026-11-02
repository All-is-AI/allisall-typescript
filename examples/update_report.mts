import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace REPORT_ID with the id of one of your reports.
const reportId = "REPORT_ID";

try {
  // A member left out keeps its value; null clears it.
  const report = await client.reports.update(reportId, {
    note: "August was the first full month on the new routing rules.",
    disclosures: [
      { kind: "unpriced", included: true, text: null },
      {
        kind: "token_valued",
        included: true,
        text: "Model costs for 220 events were valued from token counts at list prices.",
      },
    ],
  });
  console.log(`report ${report.id}: ${report.note}`);
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
