const SHAPES = ["Android", "Peanut", "Pear", "Egg", "Teardrop", "Snowman", "Lightbulb", "Rocket"];
const ROLL_EXPRESSIONS = ["Neutral", "Curious", "Pleased", "Surprised", "Wink"];
const CLOTHES = ["None", "Pleated shirt", "Blouse", "T-shirt", "Turtleneck", "Striped shirt", "Suit"];
const TOOLS = ["None", "Wrench", "Pencil", "Magnifying glass", "Brush", "Clipboard", "Watering can", "Telescope", "Hammer", "Saw", "Fairy wand", "Scissors", "Tongs"];
const EXTRAS = ["None", "Top hat", "Beret", "Sombrero", "Pointed hat", "Chef's hat", "Crown", "Bunny ears", "Cat ears", "Dog ears", "Antenna", "Halo", "Small wings", "Antlers", "Propeller"];
const COLOR_ROLES = [
  ["body", "Body", 0.16, 0.9],
  ["face", "Face", 0.05, 0.16],
  ["features", "Features", 0.9, 0.62],
  ["clothes", "Clothes", 0.6, 0.5],
  ["accessories", "Accessories", 0.7, 0.5],
  ["tool", "Tool", 0.7, 0.46]
];
const ROLL_FIELDS = ["shape", "expression", "clothes", "tool", "extra"];
const GARMENTS = CLOTHES.filter(name => name !== "None");
const IMPLEMENTS = TOOLS.filter(name => name !== "None");
const GROWN = EXTRAS.filter(name => name !== "None");

// hold is later rolls a new piece stays put. drought fills the next draw after that many empty rolls.
const PRESENCE = {
  clothes: { gain: 1 / 3, hold: 2, strip: 1 / 6, drought: 4, list: GARMENTS },
  tool: { gain: 1 / 2, hold: 1, strip: 1 / 4, drought: 3, list: IMPLEMENTS },
  extra: { gain: 1 / 10, hold: 6, strip: 1 / 8, drought: 0, list: GROWN }
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function other(list, current) {
  const choices = list.filter(item => item !== current);
  return pick(choices.length ? choices : list);
}

function colorFields(from) {
  const out = {};
  for (const [key, , s, l] of COLOR_ROLES) {
    out[key + "S"] = from && from[key + "S"] != null ? from[key + "S"] : s;
    out[key + "L"] = from && from[key + "L"] != null ? from[key + "L"] : l;
  }
  return out;
}

function defaultLook() {
  return {
    hue: 210,
    ...colorFields(null),
    shape: "Android",
    expression: "Neutral",
    clothes: "None",
    tool: "None",
    extra: "None"
  };
}

function nextHue(hue) {
  const min = 90;
  const delta = min + Math.floor(Math.random() * (360 - 2 * min + 1));
  return (hue + delta) % 360;
}

function blankMemory() {
  return {
    cooled: [],
    hold: { clothes: 0, tool: 0, extra: 0 },
    absent: { clothes: 0, tool: 0, extra: 0 }
  };
}

function openFields(memory, ignoreCooled) {
  const cooled = ignoreCooled ? new Set() : new Set(memory.cooled);
  return ROLL_FIELDS.filter(key => {
    if (PRESENCE[key] && memory.hold[key] > 0) return false;
    return !cooled.has(key);
  });
}

function eligibleFields(memory) {
  const ready = openFields(memory, false);
  return ready.length ? ready : openFields(memory, true);
}

function drawFields(pool) {
  if (!pool.length) return [];
  const count = Math.min(pool.length, Math.random() < 0.5 ? 1 : 2);
  const bag = pool.slice();
  const drawn = [];
  while (drawn.length < count) drawn.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
  return drawn;
}

function writeField(next, field, from, memory, force) {
  if (field === "shape") {
    next.shape = other(SHAPES, from.shape);
    return;
  }
  if (field === "expression") {
    next.expression = other(ROLL_EXPRESSIONS, from.expression);
    return;
  }
  const spec = PRESENCE[field];
  const current = from[field];
  if (current === "None") {
    const due = spec.drought > 0 && memory.absent[field] >= spec.drought;
    const hit = force || due || Math.random() < spec.gain;
    next[field] = hit ? pick(spec.list) : "None";
    return;
  }
  if (!force && Math.random() < spec.strip) {
    next[field] = "None";
    return;
  }
  next[field] = other(spec.list, current);
}

function rollOnce(from, memory, missed) {
  const next = { ...from, hue: nextHue(from.hue) };
  for (const field of drawFields(eligibleFields(memory))) {
    if (missed && missed.has(field)) continue;
    writeField(next, field, from, memory, false);
    if (missed && PRESENCE[field] && from[field] === "None" && next[field] === "None") missed.add(field);
  }
  return next;
}

function changedFields(from, next) {
  return ROLL_FIELDS.filter(key => next[key] !== from[key]);
}

function memoryAfter(from, next, memory) {
  const hold = { clothes: 0, tool: 0, extra: 0 };
  const absent = { clothes: 0, tool: 0, extra: 0 };
  for (const field of Object.keys(PRESENCE)) {
    let left = Math.max(0, memory.hold[field] - 1);
    if (next[field] === "None") absent[field] = (from[field] === "None" ? memory.absent[field] : 0) + 1;
    else if (from[field] === "None") left = PRESENCE[field].hold;
    hold[field] = left;
  }
  return { cooled: changedFields(from, next), hold, absent };
}

function fallbackField(from, memory) {
  const preferred = eligibleFields(memory).find(field => field !== "extra" || from.extra !== "None");
  return preferred || "shape";
}

function rollFrom(from, memory) {
  const mem = memory || blankMemory();
  const missed = new Set();
  const moved = (next) => changedFields(from, next).length > 0;
  let next = rollOnce(from, mem, missed);
  for (let i = 0; i < 8 && !moved(next); i++) next = rollOnce(from, mem, missed);
  if (!moved(next)) writeField(next, fallbackField(from, mem), from, mem, true);
  return { look: next, memory: memoryAfter(from, next, mem) };
}

function loosen(memory, key) {
  if (!PRESENCE[key]) return memory;
  return {
    cooled: memory.cooled.slice(),
    hold: { ...memory.hold, [key]: 0 },
    absent: { ...memory.absent, [key]: 0 }
  };
}

export {
  SHAPES, ROLL_EXPRESSIONS, CLOTHES, TOOLS, EXTRAS, COLOR_ROLES, ROLL_FIELDS, PRESENCE,
  defaultLook, blankMemory, rollFrom, loosen, changedFields, openFields
};
