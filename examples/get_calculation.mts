import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CALCULATION_ID with the id of one of your calculations.
const calculationId = "CALCULATION_ID";

try {
  const calculation = await client.calculations.get(calculationId);
  console.log(
    `${calculation.state}, ROI ${calculation.ratios.roi ?? "undefined"}`,
  );
  console.log(
    `value ${calculation.value_total ?? "none"}, cost ${calculation.cost_total} ${calculation.currency}`,
  );
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
