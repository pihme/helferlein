import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as api from "../src/index.js";

const dts = readFileSync(new URL("../types/index.d.ts", import.meta.url), "utf8");

function union(name) {
  const m = dts.match(new RegExp(`export type ${name} =([^;]+);`));
  assert.ok(m, `type ${name} in index.d.ts`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
}

test("the declared catalog matches the shipped lists", () => {
  assert.deepEqual(union("Shape"), api.SHAPES);
  assert.deepEqual(union("Expression"), api.ROLL_EXPRESSIONS);
  assert.deepEqual(union("Clothes"), api.CLOTHES);
  assert.deepEqual(union("Tool"), api.TOOLS);
  assert.deepEqual(union("Extra"), api.EXTRAS);
});

test("the declared look, memory and exports match the code", () => {
  const look = dts.match(/export interface Look \{([^}]+)\}/)[1];
  const keys = [...look.matchAll(/^\s+(\w+):/gm)].map(x => x[1]).sort();
  assert.deepEqual(keys, Object.keys(api.defaultLook()).sort());
  assert.deepEqual(Object.keys(api.blankMemory()).sort(), ["absent", "cooled", "hold"]);
  const declared = [...dts.matchAll(/^export (?:function|const) (\w+)/gm)].map(x => x[1]).sort();
  assert.deepEqual(declared, Object.keys(api).sort());
  const blob = api.rollFrom(api.defaultLook(), api.blankMemory());
  assert.deepEqual(Object.keys(blob).sort(), ["look", "memory"]);
});

test("the public rollFrom names a missing or broken look", () => {
  assert.throws(() => api.rollFrom(), { name: "TypeError", message: /rollFrom\(look, memory\) needs a look/ });
  assert.throws(() => api.rollFrom({}), /look is missing hue/);
  assert.throws(() => api.rollFrom(api.defaultLook(), { cooled: [] }), /memory is missing hold/);
  const roll = api.rollFrom({ ...api.defaultLook(), hue: -30 });
  assert.ok(Number.isInteger(roll.look.hue) && roll.look.hue >= 0 && roll.look.hue < 360);
  assert.deepEqual(Object.keys(api.rollFrom(api.defaultLook(), null)).sort(), ["look", "memory"]);
});
