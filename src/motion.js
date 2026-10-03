const SPIN_MS = 1200;

function revealPortion() {
  return 1 - Math.cbrt(0.5);
}

function spinYaw(u) {
  const t = Math.min(1, Math.max(0, u));
  return (1 - Math.pow(1 - t, 3)) * Math.PI * 2;
}

function advanceSpin(spin, now) {
  const u = Math.min(1, (now - spin.t0) / SPIN_MS);
  const yaw = spinYaw(u);
  return { u, yaw, reveal: !spin.shown && yaw >= Math.PI, done: u >= 1 };
}

// Committed look swaps when the back faces the viewer. Dismiss drops the spin before that.
function stepTurn(state, spin, now) {
  if (!spin) return { state, spin: null, yaw: 0, rebuilt: false };
  const step = advanceSpin(spin, now);
  let next = state;
  let current = spin;
  let rebuilt = false;
  if (step.reveal) {
    next = {
      ...state,
      look: spin.pending,
      memory: spin.memory,
      pending: null,
      pendingMemory: null
    };
    current = { ...spin, shown: true };
    rebuilt = true;
  }
  if (step.done) {
    current = null;
    if (next.turning) next = { ...next, turning: false };
  }
  return { state: next, spin: current, yaw: step.done ? 0 : step.yaw, rebuilt };
}

function screenLook(state, nowMs) {
  const look = { ...state.look };
  if (state.presence !== "present") look.expression = "Resting";
  else if (state.activity === "working" && !state.turning) {
    look.expression = Math.floor(nowMs / 1000 / 0.45) % 2 === 0 ? "Focused" : "Determined";
  }
  return look;
}

function earFlick(local) {
  const burst = (start, dur) => {
    if (local < start || local >= start + dur) return 0;
    const k = (local - start) / dur;
    const s = Math.sin(Math.PI * k);
    return s * s;
  };
  return burst(0, 0.18) + burst(0.24, 0.12) * 0.65;
}

const SOCKETS = [
  "headTop", "earLeft", "earRight", "back",
  "shoulderLeft", "shoulderRight", "handLeft", "handRight"
];

export { SOCKETS, SPIN_MS, advanceSpin, earFlick, revealPortion, screenLook, spinYaw, stepTurn };
