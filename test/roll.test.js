import assert from "node:assert/strict";
import test from "node:test";
import {
  COLOR_ROLES, PRESENCE, ROLL_EXPRESSIONS,
  blankMemory, changedFields, defaultLook, loosen, openFields, rollFrom
} from "../src/roll.js";

function circ(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

test("a few thousand rolls keep the sit-out, the locks, and the hue gap", () => {
  let look = defaultLook();
  let memory = blankMemory();
  const history = [{ ...look }];
  let hueMin = 360;
  for (let i = 0; i < 4000; i++) {
    const beforeLook = look;
    const beforeMem = memory;
    const roll = rollFrom(look, memory);
    look = roll.look;
    memory = roll.memory;
    history.push(look);
    const changed = changedFields(beforeLook, look);
    assert.ok(changed.length >= 1 && changed.length <= 2, `change count ${changed.length}`);
    const hueD = circ(beforeLook.hue, look.hue);
    assert.ok(hueD >= 90, `hue distance ${hueD}`);
    hueMin = Math.min(hueMin, hueD);
    assert.ok(ROLL_EXPRESSIONS.includes(look.expression));
    for (const [key] of COLOR_ROLES) {
      assert.equal(look[key + "S"], beforeLook[key + "S"]);
      assert.equal(look[key + "L"], beforeLook[key + "L"]);
    }
    const ready = openFields(beforeMem, false);
    const safe = ready.some(field => field !== "extra" || beforeLook.extra !== "None");
    if (safe) {
      for (const field of changed) assert.ok(!beforeMem.cooled.includes(field), `cooled ${field} changed`);
    }
    assert.deepEqual(memory.cooled, changed);
    for (const field of ["clothes", "tool", "extra"]) {
      if (beforeMem.hold[field] > 0) assert.equal(look[field], beforeLook[field]);
      const gained = beforeLook[field] === "None" && look[field] !== "None";
      const expectHold = gained ? PRESENCE[field].hold : Math.max(0, beforeMem.hold[field] - 1);
      assert.equal(memory.hold[field], expectHold);
      const expectAbsent = look[field] === "None"
        ? (beforeLook[field] === "None" ? beforeMem.absent[field] : 0) + 1
        : 0;
      assert.equal(memory.absent[field], expectAbsent);
    }
  }
  assert.equal(hueMin, 90);
  for (let i = 1; i < history.length; i++) {
    if (history[i - 1].extra !== "None" || history[i].extra === "None") continue;
    const stuck = history[i].extra;
    for (let k = 1; k <= 6 && i + k < history.length; k++) {
      assert.equal(history[i + k].extra, stuck, `extra dropped after ${k} rolls`);
    }
  }
});

test("an occupied clothes draw clears about one time in six", () => {
  let strips = 0;
  let clothChanges = 0;
  for (let i = 0; i < 2400; i++) {
    const look = defaultLook();
    const memory = blankMemory();
    memory.hold.tool = 5000;
    memory.hold.extra = 5000;
    look.tool = "Saw";
    look.extra = "Halo";
    look.clothes = "Suit";
    const roll = rollFrom(look, memory);
    assert.equal(roll.look.tool, "Saw");
    assert.equal(roll.look.extra, "Halo");
    if (roll.look.clothes !== "Suit") {
      clothChanges += 1;
      if (roll.look.clothes === "None") strips += 1;
      assert.equal(roll.memory.hold.clothes, 0);
    }
  }
  assert.ok(clothChanges >= 800, `clothes changes ${clothChanges}`);
  const rate = strips / clothChanges;
  assert.ok(rate > 0.12 && rate < 0.22, `strip rate ${rate}`);
});

test("clothes empty for four rolls fill on the next draw, and lock for two", () => {
  for (let i = 0; i < 100; i++) {
    const look = defaultLook();
    const memory = blankMemory();
    memory.hold.tool = 8;
    memory.hold.extra = 8;
    memory.cooled = ["shape", "expression"];
    memory.absent.clothes = 4;
    look.tool = "Saw";
    look.extra = "Halo";
    const roll = rollFrom(look, memory);
    assert.notEqual(roll.look.clothes, "None");
    assert.equal(roll.look.shape, "Android");
    assert.equal(roll.look.expression, "Neutral");
    assert.equal(roll.look.tool, "Saw");
    assert.equal(roll.look.extra, "Halo");
    assert.equal(roll.memory.hold.clothes, 2);
  }
});

test("a tool empty for three rolls fills and locks for one", () => {
  for (let i = 0; i < 100; i++) {
    const look = defaultLook();
    const memory = blankMemory();
    memory.hold.clothes = 8;
    memory.hold.extra = 8;
    memory.cooled = ["shape", "expression"];
    memory.absent.tool = 3;
    look.clothes = "Suit";
    look.extra = "Halo";
    const roll = rollFrom(look, memory);
    assert.notEqual(roll.look.tool, "None");
    assert.equal(roll.memory.hold.tool, 1);
  }
});

test("an empty extra is not forced when it is the only free slot", () => {
  let gains = 0;
  const trials = 800;
  for (let i = 0; i < trials; i++) {
    const look = defaultLook();
    const memory = blankMemory();
    memory.hold.clothes = 8;
    memory.hold.tool = 8;
    memory.cooled = ["shape", "expression"];
    memory.absent.extra = 40;
    look.clothes = "Suit";
    look.tool = "Saw";
    const roll = rollFrom(look, memory);
    if (roll.look.extra !== "None") {
      gains += 1;
      assert.equal(roll.memory.hold.extra, 6);
      assert.equal(roll.look.shape, "Android");
    } else {
      assert.ok(roll.look.shape !== "Android" || roll.look.expression !== "Neutral");
    }
  }
  const rate = gains / trials;
  assert.ok(rate > 0.05 && rate < 0.16, `extra gain rate ${rate}`);
});

test("a hand edit clears that slot's lock and empty streak", () => {
  const memory = blankMemory();
  memory.hold.extra = 4;
  memory.absent.extra = 3;
  memory.cooled = ["extra", "shape"];
  const freed = loosen(memory, "extra");
  assert.equal(freed.hold.extra, 0);
  assert.equal(freed.absent.extra, 0);
  assert.deepEqual(freed.cooled, ["extra", "shape"]);
  assert.equal(loosen(memory, "shape"), memory);
});
