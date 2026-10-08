// Fails when a build output grows past its fixed budget (bytes, raw and gzip).
// Raising a budget is a deliberate change in this file, with the reason in the commit.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = {
  // Custom meshes (hat brim, cat ears, hammer fillet, coil, tool outlines) passed 92 kB raw and 23 kB gzip.
  "dist/helferlein.js": { raw: 112_000, gzip: 28_000 },
  "dist/helferlein.min.js": { raw: 640_000, gzip: 165_000 }
};

let failed = false;
for (const [file, limit] of Object.entries(BUDGET)) {
  const bytes = readFileSync(file);
  const raw = bytes.length;
  const gzip = gzipSync(bytes, { level: 9 }).length;
  const ok = raw <= limit.raw && gzip <= limit.gzip;
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "OVER"} ${file}: ${raw} B (budget ${limit.raw}), gzip ${gzip} B (budget ${limit.gzip})`);
}
if (failed) process.exit(1);
