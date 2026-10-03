import { CLOTHES, EXTRAS, SHAPES, TOOLS } from "./roll.js";

const builders = {
  shape: new Map(),
  clothes: new Map(),
  tool: new Map(),
  extra: new Map()
};

function reject(message) {
  throw new Error(`rejected: ${message}`);
}

function slot(kind) {
  const found = builders[kind];
  if (!found) reject(`unknown kind ${kind}`);
  return found;
}

function register(kind, name, build = () => null) {
  const found = slot(kind);
  if (found.has(name)) reject(`${kind} already has ${name}`);
  if (typeof build !== "function") reject(`${kind} ${name} has no builder`);
  found.set(name, build);
}

for (const name of SHAPES) register("shape", name);
for (const name of CLOTHES) register("clothes", name);
for (const name of TOOLS) register("tool", name);
for (const name of EXTRAS) register("extra", name);

function setBuilder(kind, name, build) {
  const found = slot(kind);
  if (!found.has(name)) reject(`unknown ${kind} ${name}`);
  if (typeof build !== "function") reject(`${kind} ${name} has no builder`);
  found.set(name, build);
}

function catalogNames(kind) {
  return [...slot(kind).keys()];
}

function catalogBuilder(kind, name) {
  const found = slot(kind);
  if (!found.has(name)) reject(`unknown ${kind} ${name}`);
  return found.get(name);
}

export { catalogBuilder, catalogNames, register, setBuilder };
