import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // Every cost line item in the workspace, page by page.
  for await (const item of client.cost.listLineItems()) {
    console.log(
      `${item.label}: ${item.monthly_amount} ${item.currency} a month from ${item.start_date}`,
    );
  }
} catch (error) {
  // The API refused the request, for example a key without the read scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
