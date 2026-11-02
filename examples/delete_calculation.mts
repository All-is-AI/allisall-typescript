import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CALCULATION_ID with the id of one of your calculations.
const calculationId = "CALCULATION_ID";

try {
  await client.calculations.delete(calculationId);
  console.log(`deleted calculation ${calculationId}`);
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
