// Turning the mapping an import ran with into the mapping a commit sends.

import type { AppliedImportMapping, ImportMapping } from "./types.js";

/**
 * Returns the mapping an import ran with, read from `imports.get`, as the
 * `mapping` of the next `imports.preview` or `imports.commit`.
 *
 * It copies the four members and refuses nothing. A delimiter this SDK
 * does not list is sent as it is, and the API answers it as it answers any
 * mapping.
 */
export function toImportMapping(applied: AppliedImportMapping): ImportMapping {
  return {
    columns: { ...applied.columns },
    constants: { ...applied.constants },
    timezone: applied.timezone,
    // The response's delimiter is an open set and the request's is closed.
    // The API is the check: it refuses a delimiter it does not accept, so a
    // value this SDK does not list is passed through unchanged.
    delimiter: applied.delimiter as NonNullable<ImportMapping["delimiter"]>,
  };
}
