import { Allisall, ApiError } from "@allisall/sdk";

// Reads the API key from AIA_API_KEY.
const client = new Allisall();

try {
  // August 2026 in Tokyo: each day runs from local midnight.
  const summary = await client.events.getSummary({
    from: "2026-08-01T00:00:00+09:00",
    to: "2026-09-01T00:00:00+09:00",
  });
  console.log(`${summary.total} events`);
  for (const day of summary.days) {
    console.log(`${day.start}: ${day.count}`);
  }
  for (const category of summary.categories) {
    console.log(`${category.category}: ${category.count}`);
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
