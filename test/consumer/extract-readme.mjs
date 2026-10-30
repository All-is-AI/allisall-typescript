// Writes each ```ts block of README.md to test/consumer/readme/example-<n>.ts,
// so the consumer check compiles the README's examples as written.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const readme = readFileSync(
  new URL("../../README.md", import.meta.url),
  "utf8",
);
const out = new URL("./readme/", import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
const blocks = [...readme.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1]);
if (blocks.length === 0) throw new Error("README.md has no ts examples");
blocks.forEach((code, i) => {
  // `export {}` keeps each example a module of its own.
  writeFileSync(new URL(`example-${i + 1}.ts`, out), `${code}\nexport {};\n`);
});
console.log(`extracted ${blocks.length} README examples`);
