import { Allisall, ApiError, decimal } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace CLIENT_ID with the id of one of your clients.
const clientId = "CLIENT_ID";

try {
  // The line items replace the model's whole set, and version must be the
  // model's current version, so read it first.
  const current = await client.valueModels.getForClient(clientId);
  const model = await client.valueModels.setLineItemsForClient(clientId, {
    version: current.version,
    line_items: [
      {
        outcome_type: "ticket_resolved",
        label: "Support ticket resolved autonomously",
        unit_value: decimal("1200"),
        provenance_note:
          "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket.",
      },
      {
        outcome_type: "escalation_avoided",
        label: "Escalation to a human agent avoided",
        unit_value: decimal("450.5"),
      },
    ],
  });
  console.log(
    `version ${model.version} holds ${model.line_items.length} line items`,
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
