import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace COST_LINE_ITEM_ID with the id of one of your cost line items.
const costLineItemId = "COST_LINE_ITEM_ID";

try {
  // A member left out keeps its value; null clears it.
  const item = await client.cost.updateLineItem(costLineItemId, {
    end_date: "2026-12-31",
  });
  console.log(`${item.label} now ends on ${item.end_date}`);
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
