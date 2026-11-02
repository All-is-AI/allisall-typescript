// Text that UTF-8 cannot encode. A JavaScript string is UTF-16, so it can
// hold a surrogate without its partner. JSON.stringify writes one as an
// escape such as \ud800, and a URL or form writes it as U+FFFD; either way
// the API stores a character the caller never sent.

// A high surrogate not followed by a low one, or a low one not preceded by
// a high one.
const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** Whether `text` holds a UTF-16 surrogate without its partner. */
export function hasLoneSurrogate(text: string): boolean {
  return LONE_SURROGATE.test(text);
}
