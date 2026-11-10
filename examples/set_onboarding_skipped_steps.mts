import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The steps replace the whole set of skipped steps; [] clears every skip.
  const progress = await client.onboarding.setSkippedSteps({
    steps: ["add_agent"],
  });
  console.log(`resume at: ${progress.current_step ?? "every step is done"}`);
} catch (error) {
  // The API refused the request, for example a key without the write scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
