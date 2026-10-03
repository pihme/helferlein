import assert from "node:assert/strict";
import test from "node:test";
import { blankMemory, defaultLook } from "../src/roll.js";
import { normalizeStore } from "../demo/store.js";

test("a saved look is kept and unknown fields are dropped", () => {
  const { store, keep } = normalizeStore({
    look: defaultLook(),
    memory: blankMemory(),
    background: "#e4eef8",
    chatOpen: true,
    messages: [
      { from: "you", text: "hello" },
      { from: "helferlein", text: "working", think: true },
      { from: "other", text: "nope" },
      { text: "missing" }
    ],
    extraJunk: true
  });
  assert.equal(keep, true);
  assert.equal(store.look.shape, "Android");
  assert.equal(store.background, "#e4eef8");
  assert.equal(store.chatOpen, true);
  assert.deepEqual(store.messages, [
    { from: "you", text: "hello", think: false },
    { from: "helferlein", text: "working", think: true }
  ]);
  assert.equal("extraJunk" in store, false);
});

test("a look the catalog no longer accepts is dropped", () => {
  const look = defaultLook();
  look.shape = "Not a body";
  const { store, keep } = normalizeStore({ look, memory: blankMemory(), chatOpen: true });
  assert.equal(keep, false);
  assert.equal(store.look, null);
  assert.equal(store.chatOpen, false);
});
