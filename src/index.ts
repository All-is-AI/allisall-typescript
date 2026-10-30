// The public surface of @allisall/sdk.

export { Allisall, type ClientOptions, type RequestOptions } from "./client.js";
export { type Decimal, decimal } from "./decimal.js";
export {
  AllisallError,
  ApiError,
  ConnectionError,
  IngestError,
} from "./errors.js";
export type { FetchLike, TokenProvider } from "./transport.js";
export type {
  ErrorCode,
  EventCategory,
  EventInput,
  FieldError,
  FieldErrorCode,
  IngestRowError,
  IngestSummary,
  Problem,
} from "./types.js";
