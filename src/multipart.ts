// A CSV import's body: a form of two parts, the mapping and then the file.

import type { components } from "./generated/openapi.js";
import { encodeJson } from "./money.js";
import { hasLoneSurrogate } from "./unicode.js";

/** A CSV upload: the mapping of its columns, and the file itself. */
export interface ImportUpload {
  /** How the file's columns map to event members, sent as the first part. */
  mapping: components["schemas"]["ImportMapping"];
  /**
   * The CSV file, sent as the second part with the type `text/csv`. A
   * `Blob` is sent without being read into memory first; in Node,
   * `fs.openAsBlob(path)` gives one for a file on disk. A stream is not
   * accepted, because a retry must send the same bytes again.
   */
  file: Blob | Uint8Array | string;
  /**
   * The file name the import records. Defaults to the name of a `File`, and
   * otherwise to `upload.csv`; an empty name counts as none. A name longer
   * than 255 characters, counted after any directory part separated by
   * `/`, is refused with `400` `too_long`.
   */
  filename?: string | undefined;
}

const DEFAULT_FILENAME = "upload.csv";

function nameOf(file: Blob): string | undefined {
  const name: unknown = Reflect.get(file, "name");
  return typeof name === "string" && name !== "" ? name : undefined;
}

/**
 * Builds the form once, `mapping` before `file`, as the API reads them. The
 * same form is the body of every attempt.
 *
 * @throws {TypeError} when the upload is not an object, the mapping has no
 * JSON text, or the file is not a `Blob`, a `Uint8Array` or a string, or
 * is a string holding a lone surrogate.
 */
export function formOf(upload: ImportUpload): FormData {
  if (typeof upload !== "object" || upload === null) {
    throw new TypeError(
      "allisall: an import takes an object with mapping and file",
    );
  }
  const { mapping, file, filename } = upload;
  const mappingPart = new Blob([encodeJson(mapping, [])], {
    type: "application/json",
  });
  let filePart: Blob;
  let defaultName = DEFAULT_FILENAME;
  if (file instanceof Blob) {
    // A File keeps its own name; its type is set to the one the API reads.
    defaultName = nameOf(file) ?? DEFAULT_FILENAME;
    filePart = new Blob([file], { type: "text/csv" });
  } else if (file instanceof Uint8Array || typeof file === "string") {
    // A Blob writes a lone surrogate as U+FFFD, changing the file in silence.
    if (typeof file === "string" && hasLoneSurrogate(file)) {
      throw new TypeError(
        "allisall: the import's file is not valid Unicode (a lone surrogate)",
      );
    }
    filePart = new Blob([file], { type: "text/csv" });
  } else {
    throw new TypeError(
      "allisall: an import's file must be a Blob, a Uint8Array or a string; a stream cannot be sent again on a retry",
    );
  }
  const form = new FormData();
  form.append("mapping", mappingPart, "mapping.json");
  // An empty name falls back, as a File with no name does.
  const name =
    typeof filename === "string" && filename !== "" ? filename : defaultName;
  form.append("file", filePart, name);
  return form;
}
