// Builds dist/helferlein.js (ESM, three external) and dist/helferlein.min.js (three bundled, IIFE).
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const threeLicense = readFileSync(new URL("../node_modules/three/LICENSE", import.meta.url), "utf8").trim();
const threeVersion = JSON.parse(readFileSync(new URL("../node_modules/three/package.json", import.meta.url), "utf8")).version;

const own = `/*! Helferlein ${pkg.version} | PolyForm Noncommercial 1.0.0 | https://github.com/pihme/helferlein */`;
const common = {
  entryPoints: ["src/index.js"],
  bundle: true,
  target: "es2020",
  legalComments: "none",
  logLevel: "info"
};

await build({
  ...common,
  outfile: "dist/helferlein.js",
  format: "esm",
  external: ["three"],
  banner: { js: own }
});

await build({
  ...common,
  outfile: "dist/helferlein.min.js",
  format: "iife",
  globalName: "Helferlein",
  minify: true,
  banner: { js: `${own}\n/*! Includes three.js ${threeVersion}, MIT license:\n${threeLicense}\n*/` },
  // Also global when the file is loaded as a module (import "helferlein/min").
  footer: { js: "globalThis.Helferlein = Helferlein;" }
});
