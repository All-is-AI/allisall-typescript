// The retry decision and the wait between attempts.

/** The longest `Retry-After` the SDK honours. A longer one ends the call. */
export const MAX_RETRY_AFTER_MS = 60_000;

const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8_000;

/** The statuses worth repeating: a proxy's `408`, `429`, `500`, and a gateway's `502`, `503`, `504`. */
export function isRetryableStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/**
 * The wait before retry `n` (1 for the first retry) when the response
 * carried no usable `Retry-After`: `min(0.5 s × 2^(n−1), 8 s)`, multiplied
 * by a random factor between 0.75 and 1.
 */
export function backoffMs(retry: number): number {
  const base = Math.min(INITIAL_BACKOFF_MS * 2 ** (retry - 1), MAX_BACKOFF_MS);
  return base * (1 - Math.random() * 0.25);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// RFC 9110 §5.6.7: IMF-fixdate, and the two obsolete forms a recipient must accept.
const IMF_FIXDATE =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/;
const RFC850_DATE =
  /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-([A-Z][a-z]{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) GMT$/;
const ASCTIME_DATE =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) ([A-Z][a-z]{2}) ([ \d]\d) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/;

function utc(
  year: number,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): number | undefined {
  const m = MONTHS.indexOf(month);
  if (m < 0) return undefined;
  const ms = Date.UTC(
    year,
    m,
    Number(day.trim()),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(ms) ? undefined : ms;
}

function parseHttpDate(value: string, now: number): number | undefined {
  let match = IMF_FIXDATE.exec(value);
  if (match !== null) {
    const [, day = "", month = "", year = "", h = "", m = "", s = ""] = match;
    return utc(Number(year), month, day, h, m, s);
  }
  match = RFC850_DATE.exec(value);
  if (match !== null) {
    const [, day = "", month = "", yy = "", h = "", m = "", s = ""] = match;
    // RFC 9110 §5.6.7: a two-digit year more than 50 years in the future is in the past century.
    const thisYear = new Date(now).getUTCFullYear();
    let year = 2000 + Number(yy);
    if (year > thisYear + 50) year -= 100;
    return utc(year, month, day, h, m, s);
  }
  match = ASCTIME_DATE.exec(value);
  if (match !== null) {
    const [, month = "", day = "", h = "", m = "", s = "", year = ""] = match;
    return utc(Number(year), month, day, h, m, s);
  }
  return undefined;
}

/**
 * Parses a `Retry-After` value, delay-seconds or an HTTP-date (RFC 9110
 * §10.2.3), into milliseconds from `now`. Returns `undefined` for a value
 * that does not parse or names a time in the past.
 */
export function parseRetryAfter(
  value: string | null,
  now: number,
): number | undefined {
  if (value === null) return undefined;
  const text = value.trim();
  if (/^\d+$/.test(text)) return Number(text) * 1000;
  const at = parseHttpDate(text, now);
  if (at === undefined || at < now) return undefined;
  return at - now;
}

/** Waits `ms` milliseconds, or rejects with the signal's reason when it aborts first. */
export function sleep(
  ms: number,
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
