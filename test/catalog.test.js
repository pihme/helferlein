import assert from "node:assert/strict";
import test from "node:test";
import { catalogBuilder, catalogNames } from "../src/catalog.js";

const SPEC = {
  shape: ["Android", "Peanut", "Pear", "Egg", "Teardrop", "Snowman", "Lightbulb", "Rocket"],
  clothes: ["None", "Pleated shirt", "Blouse", "T-shirt", "Turtleneck", "Striped shirt", "Suit"],
  tool: ["None", "Wrench", "Pencil", "Magnifying glass", "Brush", "Clipboard", "Watering can", "Telescope", "Hammer", "Saw", "Fairy wand", "Scissors", "Tongs"],
  extra: ["None", "Top hat", "Beret", "Sombrero", "Pointed hat", "Chef's hat", "Crown", "Bunny ears", "Cat ears", "Dog ears", "Antenna", "Halo", "Small wings", "Antlers", "Propeller"]
};

test("the catalog is the section 8 names, and nothing else", () => {
  for (const [kind, names] of Object.entries(SPEC)) {
    assert.deepEqual(catalogNames(kind), names);
    for (const name of names) {
      const build = catalogBuilder(kind, name);
      assert.equal(typeof build, "function");
      assert.equal(build(), null);
    }
  }
});

test("an unknown name or kind is rejected", () => {
  assert.throws(() => catalogBuilder("shape", "Block"), /unknown shape Block/);
  assert.throws(() => catalogBuilder("clothes", "Dress"), /unknown clothes Dress/);
  assert.throws(() => catalogBuilder("tool", "Lamp"), /unknown tool Lamp/);
  assert.throws(() => catalogBuilder("extra", "Flower"), /unknown extra Flower/);
  assert.throws(() => catalogNames("expression"), /unknown kind expression/);
});
