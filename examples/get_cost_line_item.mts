import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace COST_LINE_ITEM_ID with the id of one of your cost line items.
const costLineItemId = "COST_LINE_ITEM_ID";

try {
  const item = await client.cost.getLineItem(costLineItemId);
  console.log(`${item.label}: ${item.monthly_amount} ${item.currency} a month`);
  console.log(`from ${item.start_date} to ${item.end_date ?? "no end date"}`);
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
