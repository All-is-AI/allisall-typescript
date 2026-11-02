import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  const table = await client.cost.getPriceTable();
  for (const rate of table.models) {
    console.log(
      `${rate.model}: ${rate.input_per_1k} in, ${rate.output_per_1k} out, per 1,000 tokens in ${table.currency}`,
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
