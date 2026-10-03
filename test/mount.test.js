import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { fitCanvas, motionPreference, mountWith } from "../src/figure.js";
import { screenLook } from "../src/motion.js";
import { blankMemory, defaultLook } from "../src/roll.js";

function fakeNode(tagName) {
  return {
    tagName,
    parentNode: null,
    children: [],
    dataset: {},
    attrs: {},
    innerHTML: "",
    clientWidth: 320,
    clientHeight: 360,
    style: { props: {}, setProperty(key, value) { this.props[key] = value; } },
    setAttribute(key, value) { this.attrs[key] = value; },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    removeChild(child) { this.children = this.children.filter(c => c !== child); child.parentNode = null; return child; },
    // A browser without WebGL hands out no context.
    getContext: () => null
  };
}

const ctx = {
  createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
  putImageData() {}, fillRect() {}, beginPath() {}, arc() {}, ellipse() {}, fill() {}, moveTo() {}, lineTo() {}
};

function harness() {
  const frames = [];
  const clock = { t: 1000 };
  const env = {
    document: { createElement: tag => fakeNode(tag.toUpperCase()) },
    createCanvas: (w, h) => ({ width: w, height: h, getContext: () => ctx }),
    now: () => clock.t,
    requestFrame: fn => { frames.push(fn); return frames.length; },
    cancelFrame() {}
  };
  const step = (ms = 16) => {
    clock.t += ms;
    const fn = frames.shift();
    if (fn) fn(clock.t);
  };
  return { env, step, clock };
}

class FakeRenderer {
  constructor() { FakeRenderer.last = this; }
  setPixelRatio() {}
  setClearColor() {}
  setSize() {}
  render(scene) { this.scene = scene; }
  dispose() { this.disposed = true; }
}

const FAKE_THREE = { ...THREE, WebGLRenderer: FakeRenderer };

function rigOf() {
  return FakeRenderer.last.scene.children.find(obj => obj.isGroup);
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test("without WebGL the figure falls back to a still silhouette and keeps the host contract", async () => {
  const { env } = harness();
  const host = fakeNode("DIV");
  const figure = mountWith(host, THREE, {}, env);
  assert.equal(figure.webgl, false);
  assert.ok(figure.error);
  assert.equal(host.children.length, 1);
  const node = host.children[0];
  assert.equal(node.className, "helferlein-fallback");
  assert.equal(node.attrs.role, "img");
  assert.equal(node.dataset.presence, "resting");

  figure.summon();
  assert.equal(node.dataset.presence, "present");
  figure.working();
  assert.equal(node.dataset.activity, "working");
  const before = figure.getBlob();
  let revealed = 0;
  figure.watchReveal(() => { revealed += 1; });
  await figure.applied();
  assert.equal(revealed, 1);
  assert.notDeepEqual(figure.getBlob().look, before.look);
  assert.equal(node.dataset.activity, "idle");
  assert.match(node.style.props["--helferlein-body"], /^hsl\(/);

  figure.setBlob({ look: defaultLook(), memory: blankMemory() });
  assert.deepEqual(figure.getBlob().look, defaultLook());
  assert.throws(() => figure.setBlob({ look: { hue: 1 }, memory: blankMemory() }), /rejected/);
  figure.dismiss();
  assert.equal(node.dataset.presence, "resting");
  figure.dispose();
  assert.equal(host.children.length, 0);
});

test("reduced motion follows prefers-reduced-motion, live, unless the host fixes it", () => {
  const listeners = [];
  const query = {
    matches: true,
    addEventListener: (type, fn) => listeners.push(fn),
    removeEventListener: (type, fn) => listeners.splice(listeners.indexOf(fn), 1)
  };
  const window = { matchMedia: q => { assert.equal(q, "(prefers-reduced-motion: reduce)"); return query; } };
  const pref = motionPreference({}, { window });
  assert.equal(pref.calm, true);
  listeners[0]({ matches: false });
  assert.equal(pref.calm, false);
  pref.stop();
  assert.equal(listeners.length, 0);

  assert.equal(motionPreference({ reducedMotion: false }, { window }).calm, false);
  assert.equal(motionPreference({ reducedMotion: true }, {}).calm, true);
  assert.equal(motionPreference({}, { window: {} }).calm, false);
});

test("reduced motion: no swoop, no float, a steady working face, and the new look in one frame", async () => {
  const { env, step } = harness();
  const figure = mountWith(fakeNode("DIV"), FAKE_THREE, { reducedMotion: true }, env);
  assert.equal(figure.webgl, true);
  assert.equal(figure.reducedMotion, true);
  figure.summon();
  step();
  const rig = rigOf();
  assert.equal(rig.scale.x, 1);
  assert.equal(rig.position.y, 0);

  figure.working();
  const inner = rig.children[0].children[0];
  const heights = [];
  for (let i = 0; i < 6; i++) {
    step(200);
    heights.push(inner.position.y);
    assert.equal(inner.rotation.x, 0);
    assert.equal(inner.rotation.z, 0);
  }
  assert.equal(new Set(heights).size, 1);
  const working = { presence: "present", activity: "working", turning: false, look: defaultLook() };
  for (const t of [0, 450, 900, 1350]) assert.equal(screenLook(working, t, true).expression, "Focused");

  const before = figure.getBlob();
  let done = false;
  let revealed = false;
  figure.watchReveal(() => { revealed = true; });
  figure.applied().then(() => { done = true; });
  step();
  await settle();
  assert.equal(revealed, true);
  assert.equal(done, true);
  assert.notDeepEqual(figure.getBlob().look, before.look);
  assert.equal(rig.children[0].rotation.y, 0);
  figure.dispose();
  assert.equal(FakeRenderer.last.disposed, true);
});

test("with motion the figure swoops, floats, and spins over several frames", async () => {
  const { env, step } = harness();
  const figure = mountWith(fakeNode("DIV"), FAKE_THREE, { reducedMotion: false }, env);
  figure.summon();
  step();
  const rig = rigOf();
  assert.ok(rig.scale.x < 1);
  const inner = rig.children[0].children[0];
  const heights = new Set();
  for (let i = 0; i < 6; i++) {
    step(200);
    heights.add(inner.position.y);
  }
  assert.ok(heights.size > 1);
  figure.working();
  step();
  let done = false;
  figure.applied().then(() => { done = true; });
  step();
  await settle();
  assert.equal(done, false);
  for (let i = 0; i < 100 && !done; i++) {
    step(50);
    await settle();
  }
  assert.equal(done, true);
  figure.dispose();
});

test("the WebGL figure, the fallback and types/index.d.ts offer the same members", async () => {
  const { readFileSync } = await import("node:fs");
  const dts = readFileSync(new URL("../types/index.d.ts", import.meta.url), "utf8");
  const body = dts.match(/export interface Figure \{([\s\S]*?)\n\}/)[1];
  const declared = [...body.matchAll(/^\s+(?:readonly )?(\w+)\??[(:]/gm)].map(m => m[1]).sort();
  const { env } = harness();
  const gl = mountWith(fakeNode("DIV"), FAKE_THREE, {}, env);
  const still = mountWith(fakeNode("DIV"), THREE, {}, harness().env);
  const optional = new Set(["error"]);
  assert.deepEqual(Object.keys(gl).sort(), declared.filter(k => !optional.has(k)));
  assert.deepEqual(Object.keys(still).sort(), declared);
  gl.dispose();
  still.dispose();
});

test("the canvas shows at its container's size, whatever the pixel ratio", () => {
  const { env, step } = harness();
  const host = fakeNode("DIV");
  const figure = mountWith(host, FAKE_THREE, { reducedMotion: true }, env);
  const canvas = host.children[0];
  assert.equal(canvas.tagName, "CANVAS");
  assert.equal(canvas.style.display, "block");
  assert.equal(canvas.style.width, "100%");
  assert.equal(canvas.style.height, "100%");
  step();
  figure.dispose();
  assert.equal(host.children.length, 0);

  // A host canvas without a CSS size keeps its mounted size instead of growing with the buffer.
  const bare = { ...fakeNode("CANVAS"), width: 300, height: 150, clientWidth: 300, clientHeight: 150 };
  const restore = fitCanvas(bare, false);
  assert.equal(bare.style.width, "300px");
  assert.equal(bare.style.height, "150px");
  restore();
  assert.equal(bare.style.width, "");
  // A host canvas sized by CSS is left alone.
  const styled = { ...fakeNode("CANVAS"), width: 640, height: 720, clientWidth: 320, clientHeight: 360 };
  fitCanvas(styled, false);
  assert.equal(styled.style.width, undefined);
});
