import { Allisall, ApiError } from "@allisall/sdk";

// Sends the signed-in user's session token from AIA_SESSION_TOKEN. This
// operation refuses an API key.
const client = new Allisall({
  tokenProvider: () => process.env.AIA_SESSION_TOKEN ?? "",
});

// Replace CALCULATION_ID with the id of one of your calculations.
const calculationId = "CALCULATION_ID";

try {
  // Moves a validated calculation back to draft, clearing its attestation.
  const calculation = await client.calculations.reopen(calculationId);
  console.log(`calculation ${calculation.id} is now ${calculation.state}`);
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
