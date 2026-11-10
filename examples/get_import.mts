import { Allisall, ApiError, toImportMapping } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

// Replace IMPORT_ID with the id of one of your imports.
const importId = "IMPORT_ID";

try {
  const item = await client.imports.get(importId);
  console.log(`${item.filename}: ${item.total_rows} rows`);
  // The mapping it ran with, ready to send as the next import's mapping.
  const mapping = toImportMapping(item.mapping);
  console.log(JSON.stringify(mapping));
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
