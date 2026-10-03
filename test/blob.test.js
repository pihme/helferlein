import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readBlob, writeBlob } from "../src/blob.js";
import { blankMemory, defaultLook, rollFrom } from "../src/roll.js";

function sample() {
  const memory = blankMemory();
  memory.cooled = ["shape", "clothes"];
  memory.hold.clothes = 2;
  memory.absent.tool = 3;
  return { look: defaultLook(), memory };
}

test("a look and its memory round-trip, including through JSON", () => {
  const { look, memory } = sample();
  const blob = writeBlob(look, memory);
  look.hue = 0;
  memory.cooled.push("tool");
  memory.hold.clothes = 0;
  const back = readBlob(JSON.parse(JSON.stringify(blob)));
  assert.equal(back.look.hue, 210);
  assert.equal(back.look.shape, "Android");
  assert.deepEqual(back.memory.cooled, ["shape", "clothes"]);
  assert.equal(back.memory.hold.clothes, 2);
  assert.equal(back.memory.absent.tool, 3);
  back.look.extra = "Halo";
  assert.equal(blob.look.extra, "None");
});

test("a rolled look and its memory round-trip", () => {
  const roll = rollFrom(defaultLook(), blankMemory());
  const back = readBlob(writeBlob(roll.look, roll.memory));
  assert.deepEqual(back.look, roll.look);
  assert.deepEqual(back.memory, roll.memory);
});

test("unknown fields are rejected", () => {
  const { look, memory } = sample();
  const blob = writeBlob(look, memory);
  assert.throws(() => readBlob({ ...blob, host: "demo" }), /unknown field host/);
  assert.throws(() => readBlob({ ...blob, look: { ...blob.look, palette: 1 } }), /unknown field palette/);
  assert.throws(() => readBlob({ ...blob, memory: { ...blob.memory, streak: 1 } }), /unknown field streak/);
  assert.throws(() => readBlob({
    ...blob,
    memory: { ...blob.memory, hold: { ...blob.memory.hold, wings: 1 } }
  }), /unknown field wings/);
  assert.throws(() => readBlob({
    ...blob,
    memory: { ...blob.memory, cooled: ["shape", "wings"] }
  }), /unknown field wings/);
  assert.throws(() => writeBlob({ ...look, shape: "Block" }, memory), /look.shape is not a known name/);
  assert.throws(() => writeBlob({ ...look, expression: "Resting" }, memory), /look.expression is not a known name/);
  assert.throws(() => readBlob({ look: blob.look }), /blob is missing memory/);
  assert.throws(() => readBlob(null), /blob is not an object/);
});

test("the blob module does not touch browser storage", () => {
  const src = readFileSync(new URL("../src/blob.js", import.meta.url), "utf8");
  assert.equal(src.includes("localStorage"), false);
  assert.equal(src.includes("sessionStorage"), false);
});

test("the hue is an integer 0..359: other numbers wrap and round, strings are rejected", () => {
  const blob = hue => readBlob({ look: { ...defaultLook(), hue }, memory: blankMemory() }).look.hue;
  assert.equal(blob(9999), 279);
  assert.equal(blob(-5), 355);
  assert.equal(blob(360), 0);
  assert.equal(blob(12.5), 13);
  assert.equal(blob(359.6), 0);
  assert.ok(Object.is(blob(-0.2), 0));
  assert.equal(blob(210), 210);
  assert.throws(() => blob("30"), /look\.hue is not a number/);
  assert.throws(() => blob(Number.NaN), /look\.hue is not a number/);
  assert.throws(() => blob(Infinity), /look\.hue is not a number/);
  assert.equal(writeBlob({ ...defaultLook(), hue: 720.4 }, blankMemory()).look.hue, 0);
});
