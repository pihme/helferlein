import { blankMemory, defaultLook, rollFrom } from "./roll.js";

function fresh() {
  return {
    presence: "resting",
    activity: "idle",
    look: defaultLook(),
    memory: blankMemory(),
    pending: null,
    pendingMemory: null,
    turning: false,
    last: "Dismissed.",
    changed: ""
  };
}

function reduce(state, action) {
  const present = state.presence === "present";
  if (action === "summon") {
    if (present) return { ...state, last: "Already here. No second swoop.", changed: "" };
    return { ...state, presence: "present", activity: "summoned", last: "Summoned.", changed: "presence" };
  }
  if (action === "working") {
    if (!present) return { ...state, last: "Dismissed. Summon first.", changed: "" };
    if (state.turning) return { ...state, last: "Already turning.", changed: "" };
    if (state.activity === "working") return { ...state, last: "Already working.", changed: "" };
    return { ...state, activity: "working", last: "Working. The face pulses between focused and determined.", changed: "activity" };
  }
  if (action === "idle") {
    if (!present) return { ...state, last: "Already dismissed.", changed: "" };
    if (state.turning) return { ...state, last: "The turn is still going.", changed: "" };
    if (state.activity === "summoned") return { ...state, last: "Still arriving.", changed: "" };
    if (state.activity !== "working") return { ...state, last: "Already idle.", changed: "" };
    return { ...state, activity: "idle", last: "Idle. Look kept.", changed: "activity" };
  }
  if (action === "applied") {
    if (!present) return { ...state, last: "Applied while dismissed does nothing.", changed: "" };
    if (state.turning) return { ...state, last: "Already turning.", changed: "" };
    if (state.activity !== "working") return { ...state, last: "Applied follows working.", changed: "" };
    const roll = rollFrom(state.look, state.memory);
    return {
      ...state,
      activity: "idle",
      turning: true,
      pending: roll.look,
      pendingMemory: roll.memory,
      last: "Applied. The new look comes around while the back faces you.",
      changed: "look"
    };
  }
  if (action === "dismiss") {
    if (!present) return { ...state, last: "Already dismissed.", changed: "" };
    return {
      ...state,
      presence: "resting",
      activity: "idle",
      turning: false,
      pending: null,
      pendingMemory: null,
      last: "Dismissed. Folds back. Look kept.",
      changed: "presence"
    };
  }
  return state;
}

export { fresh, reduce };
