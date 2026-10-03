import {
  CLOTHES, COLOR_ROLES, EXTRAS, ROLL_EXPRESSIONS, ROLL_FIELDS, SHAPES, TOOLS
} from "./roll.js";

const PRESENCE = ["clothes", "tool", "extra"];

function reject(message) {
  throw new Error(`rejected: ${message}`);
}

function only(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    reject(`${label} is not an object`);
  }
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) reject(`${label} has unknown field ${key}`);
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) reject(`${label} is missing ${key}`);
  }
}

function oneOf(value, list, label) {
  if (typeof value !== "string" || !list.includes(value)) reject(`${label} is not a known name`);
  return value;
}

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) reject(`${label} is not a number`);
  return value;
}

// Degrees on the color wheel, as an integer 0..359: other numbers wrap around and round.
function hueOf(value, label) {
  const hue = Math.round(finiteNumber(value, label)) % 360;
  return hue < 0 ? hue + 360 : hue + 0;
}

function count(value, label) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    reject(`${label} is not a count`);
  }
  return value;
}

function copyLook(look) {
  const colorKeys = COLOR_ROLES.flatMap(([key]) => [`${key}S`, `${key}L`]);
  only(look, ["hue", "shape", "expression", "clothes", "tool", "extra", ...colorKeys], "look");
  const out = {
    hue: hueOf(look.hue, "look.hue"),
    shape: oneOf(look.shape, SHAPES, "look.shape"),
    expression: oneOf(look.expression, ROLL_EXPRESSIONS, "look.expression"),
    clothes: oneOf(look.clothes, CLOTHES, "look.clothes"),
    tool: oneOf(look.tool, TOOLS, "look.tool"),
    extra: oneOf(look.extra, EXTRAS, "look.extra")
  };
  for (const key of colorKeys) out[key] = finiteNumber(look[key], `look.${key}`);
  return out;
}

function copyCounts(value, label) {
  only(value, PRESENCE, label);
  const out = {};
  for (const key of PRESENCE) out[key] = count(value[key], `${label}.${key}`);
  return out;
}

function copyMemory(memory) {
  only(memory, ["cooled", "hold", "absent"], "memory");
  if (!Array.isArray(memory.cooled)) reject("memory.cooled is not a list");
  const cooled = [];
  for (const field of memory.cooled) {
    if (typeof field !== "string" || !ROLL_FIELDS.includes(field)) {
      reject(`memory.cooled has unknown field ${String(field)}`);
    }
    if (cooled.includes(field)) reject(`memory.cooled repeats ${field}`);
    cooled.push(field);
  }
  return {
    cooled,
    hold: copyCounts(memory.hold, "memory.hold"),
    absent: copyCounts(memory.absent, "memory.absent")
  };
}

// Saturation and lightness travel with the look so a wardrobe edit survives a reload.
function writeBlob(look, memory) {
  return { look: copyLook(look), memory: copyMemory(memory) };
}

function readBlob(blob) {
  only(blob, ["look", "memory"], "blob");
  return writeBlob(blob.look, blob.memory);
}

export { readBlob, writeBlob };
