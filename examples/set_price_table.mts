import { Allisall, ApiError, decimal } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The models replace the whole price table.
  const table = await client.cost.setPriceTable({
    models: [
      {
        model: "claude-sonnet",
        input_per_1k: decimal("0.45"),
        output_per_1k: decimal("2.25"),
      },
      {
        model: "gpt-4o",
        input_per_1k: decimal("0.375"),
        output_per_1k: decimal("1.5"),
      },
    ],
  });
  console.log(`the price table holds ${table.models.length} models`);
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
