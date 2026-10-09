// The figure comes from the script-tag build (dist/helferlein.min.js). `loosen` is wardrobe-only.
import { loosen } from "../src/roll.js";
import { icon } from "./icons.js";
import { blankStore, loadStore, saveStore } from "./store.js";

if (!globalThis.Helferlein) throw new Error("dist/helferlein.min.js did not load. Run npm run build.");
const { CLOTHES, EXTRAS, ROLL_EXPRESSIONS, SHAPES, TOOLS, blankMemory, defaultLook, mount, rollFrom } = globalThis.Helferlein;

const HUES = [0, 24, 45, 70, 120, 160, 190, 210, 235, 265, 300, 330];
const MODES = [
  ["idle", "Idle"],
  ["working", "Working"],
  ["dismissed", "Dismissed"]
];
const LEFT = [
  ["shape", "Body", SHAPES],
  ["expression", "Face", ROLL_EXPRESSIONS]
];
const RIGHT = [
  ["clothes", "Clothes", CLOTHES],
  ["tool", "Tool", TOOLS],
  ["extra", "Extra", EXTRAS]
];

const store = loadStore();
document.documentElement.style.setProperty("--wash", store.background);
let figure;
try {
  figure = mount(document.getElementById("stage"), { frame: true });
} catch (error) {
  const note = document.createElement("p");
  note.className = "boot-error";
  note.textContent = "Helferlein did not start. " + error;
  document.body.append(note);
  throw error;
}
try {
  if (store.look && store.memory) figure.setBlob({ look: store.look, memory: store.memory });
} catch {
  const fresh = blankStore();
  saveStore(fresh);
  figure.setBlob({ look: defaultLook(), memory: blankMemory() });
}
figure.summon();

const form = document.getElementById("controls");
const identity = document.getElementById("identity");
const randomize = document.getElementById("randomize");
const stage = document.getElementById("stage");
let mode = "idle";
let spinning = false;
let spinGen = 0;

function lookNow() {
  return figure.getBlob().look;
}

function markLook() {
  const look = lookNow();
  document.body.dataset.hue = String(look.hue);
  document.body.dataset.shape = look.shape;
  document.body.dataset.expression = look.expression;
  document.body.dataset.clothes = look.clothes;
  document.body.dataset.tool = look.tool;
  document.body.dataset.extra = look.extra;
  document.body.dataset.mode = mode;
}

function persist() {
  const saved = figure.getBlob();
  store.look = saved.look;
  store.memory = saved.memory;
  store.pendingLook = null;
  store.pendingMemory = null;
  store.playSpin = false;
  store.returnFromBack = false;
  saveStore(store);
  paint();
}

function spinTo(blob) {
  const gen = ++spinGen;
  spinning = true;
  mode = "idle";
  figure.watchReveal(() => {
    if (gen !== spinGen) return;
    persist();
  });
  figure.applied(blob).then(() => {
    if (gen !== spinGen) return;
    spinning = false;
    paint();
  });
  paint();
}

function commit(key, value) {
  const blob = figure.getBlob();
  if (blob.look[key] === value) return;
  spinTo({
    look: { ...blob.look, [key]: value },
    memory: loosen(blob.memory, key)
  });
}

function paintHue(value) {
  if (spinning) {
    spinGen += 1;
    spinning = false;
  }
  const blob = figure.getBlob();
  figure.setBlob({
    look: { ...blob.look, hue: value },
    memory: loosen(blob.memory, "hue")
  });
  persist();
}

function setMode(next) {
  if (spinning) {
    spinGen += 1;
    spinning = false;
    figure.setBlob(figure.getBlob());
  }
  mode = next;
  if (next === "dismissed") figure.dismiss();
  else if (next === "working") {
    figure.summon();
    figure.working();
  } else {
    figure.summon();
    figure.idle();
  }
  paint();
}

function chip(key, value) {
  const pressed = lookNow()[key] === value ? "true" : "false";
  return `<button type="button" class="chip" data-attr="${key}" data-value="${value}" aria-pressed="${pressed}" aria-label="${value}">${icon(value)}<span>${value}</span></button>`;
}

function modePanel() {
  const buttons = MODES.map(([value, label]) => {
    const pressed = mode === value ? "true" : "false";
    return `<button type="button" class="chip mode" data-mode="${value}" aria-pressed="${pressed}">${label}</button>`;
  }).join("");
  return `<div class="grid modes">${buttons}</div>`;
}

function colorPanel(look) {
  const swatches = HUES.map(hue => {
    const on = Math.abs(((look.hue - hue + 540) % 360) - 180) < 12;
    return `<button type="button" class="swatch" data-hue="${hue}" aria-label="Hue ${hue}" aria-pressed="${on}" style="background:hsl(${hue} 72% 52%)"></button>`;
  }).join("");
  return `<div class="swatches">${swatches}</div>`
    + `<label class="hue">Hue <span data-readout>${look.hue}°</span>`
    + `<input type="range" min="0" max="359" step="1" data-attr="hue" value="${look.hue}"></label>`;
}

function paintRoot(root, look) {
  root.querySelectorAll(".chip[data-attr]").forEach(button => {
    button.setAttribute("aria-pressed", String(look[button.dataset.attr] === button.dataset.value));
  });
  root.querySelectorAll(".swatch").forEach(button => {
    const hue = Number(button.dataset.hue);
    const near = Math.abs(((look.hue - hue + 540) % 360) - 180) < 12;
    button.setAttribute("aria-pressed", String(near));
  });
  const slider = root.querySelector("[data-attr='hue']");
  if (slider && document.activeElement !== slider) slider.value = String(look.hue);
  const readout = root.querySelector("[data-readout]");
  if (readout) readout.textContent = `${look.hue}°`;
}

function paint() {
  const look = lookNow();
  paintRoot(identity, look);
  paintRoot(form, look);
  identity.querySelectorAll("[data-mode]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  markLook();
}

function group(title, body) {
  return `<section class="group"><h2>${title}</h2>${body}</section>`;
}

function choices(rows) {
  return rows.map(([key, title, values]) => group(title, `<div class="grid">${values.map(value => chip(key, value)).join("")}</div>`)).join("");
}

function render() {
  const look = lookNow();
  identity.innerHTML = group("State", modePanel()) + choices(LEFT) + group("Color", colorPanel(look));
  form.innerHTML = choices(RIGHT);
  paint();
}

function onPick(event) {
  const modeButton = event.target.closest("button[data-mode]");
  if (modeButton) {
    setMode(modeButton.dataset.mode);
    return;
  }
  const chipButton = event.target.closest(".chip");
  if (chipButton) {
    commit(chipButton.dataset.attr, chipButton.dataset.value);
    return;
  }
  const swatch = event.target.closest("[data-hue]");
  if (swatch) commit("hue", Number(swatch.dataset.hue));
}

identity.addEventListener("click", onPick);
form.addEventListener("click", onPick);
identity.addEventListener("input", (event) => {
  const el = event.target;
  if (!el.dataset || el.dataset.attr !== "hue") return;
  paintHue(Number(el.value));
});
randomize.addEventListener("click", () => {
  const blob = figure.getBlob();
  spinTo(rollFrom(blob.look, blob.memory));
});

let drag = null;
stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
  stage.classList.add("dragging");
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  figure.turn(dx * 0.012, dy * 0.012);
});
function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  drag = null;
  stage.classList.remove("dragging");
}
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

render();
