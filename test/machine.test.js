import assert from "node:assert/strict";
import test from "node:test";
import { fresh, reduce } from "../src/machine.js";

test("applied while dismissed or idle does nothing", () => {
  const resting = reduce(fresh(), "applied");
  assert.equal(resting.presence, "resting");
  assert.equal(resting.pending, null);
  assert.match(resting.last, /dismissed/i);

  let state = reduce(fresh(), "summon");
  state = reduce(state, "idle");
  assert.match(state.last, /arriving/i);
  state = { ...state, activity: "idle" };
  const idle = reduce(state, "applied");
  assert.equal(idle.pending, null);
  assert.match(idle.last, /follows working/i);
});

test("dismiss before the reveal keeps the old look and the old memory", () => {
  let state = reduce(reduce(fresh(), "summon"), "working");
  state = reduce(state, "applied");
  assert.ok(state.pending);
  assert.ok(state.pendingMemory);
  assert.equal(state.turning, true);
  assert.equal(state.memory.cooled.length, 0);
  assert.equal(state.look.shape, "Android");
  const look = state.look;
  const memory = state.memory;
  state = reduce(state, "dismiss");
  assert.equal(state.pending, null);
  assert.equal(state.pendingMemory, null);
  assert.equal(state.look, look);
  assert.equal(state.memory, memory);
  assert.equal(state.presence, "resting");
});

test("idle after working keeps the look", () => {
  let state = reduce(reduce(fresh(), "summon"), "working");
  state = reduce(state, "idle");
  assert.equal(state.activity, "idle");
  assert.equal(state.look.shape, "Android");
  assert.equal(state.pending, null);
  assert.match(state.last, /Look kept/);
});
