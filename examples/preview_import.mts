import { Allisall, ApiError, type ImportMapping } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // The mapping names the CSV column that holds each event member.
  const mapping: ImportMapping = {
    columns: {
      timestamp: "Time",
      agent_key: "Agent",
      client_key: "Client",
      category: "Category",
      event_type: "Type",
      cost: "Cost",
      currency: "Currency",
    },
    timezone: "Asia/Tokyo",
    delimiter: ",",
  };
  const file = [
    "Time,Agent,Client,Category,Type,Cost,Currency",
    "2026-08-14 12:12:40,support-bot,acme,model,completion,0.3683,JPY",
    "",
  ].join("\n");

  // Nothing is stored: the preview reports what an import would do.
  const preview = await client.imports.preview({ mapping, file });
  console.log(
    `${preview.valid} of ${preview.total_rows} rows valid, ${preview.rejected} rejected`,
  );
  for (const error of preview.errors) {
    console.log(`row ${error.row}: ${error.code}: ${error.detail}`);
  }
} catch (error) {
  // The API refused the request, for example a key without the ingest scope.
  if (error instanceof ApiError) {
    const { status, code, requestId } = error;
    throw new Error(
      `the API refused the request: ${status} ${code} (request ${requestId})`,
    );
  }
  throw error;
}
