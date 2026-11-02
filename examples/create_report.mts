import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CALCULATION_ID with the id of one of your calculations.
const calculationId = "CALCULATION_ID";

try {
  // The SDK sends one Idempotency-Key on every attempt, so a retry cannot
  // create a second report.
  const report = await client.reports.createForCalculation(calculationId);
  console.log(`created report ${report.id} for ${report.client_name}`);
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
