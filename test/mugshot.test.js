import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { bodyCenterY } from "../src/figure.js";
import { createMugshot } from "../design/mugshot.js";

function createCanvas(w, h) {
  const ctx = {
    createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
    putImageData() {},
    fillRect() {},
    beginPath() {},
    arc() {},
    ellipse() {},
    fill() {},
    moveTo() {},
    lineTo() {}
  };
  return { width: w, height: h, getContext: () => ctx };
}

const shot = createMugshot(THREE, { createCanvas });

function screenUp(camera) {
  return new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
}

function looking(camera) {
  return new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2).negate().normalize();
}

test("every item has a prototype picture name", () => {
  const items = shot.items();
  assert.equal(items.length, 8 + 6 + 12 + 14);
  for (const item of items) {
    const names = readdirSync(new URL(`../design/prototype/${item.folder}/`, import.meta.url));
    assert.ok(names.includes(item.slug + ".png"), item.name);
  }
});

test("front, side, and top keep the item's axes", () => {
  const { cameras } = shot.views("tool", "Wrench");
  for (const [name, camera, axis] of [
    ["front", cameras.front, new THREE.Vector3(0, 0, -1)],
    ["side", cameras.side, new THREE.Vector3(-1, 0, 0)],
    ["top", cameras.top, new THREE.Vector3(0, -1, 0)]
  ]) {
    assert.ok(looking(camera).dot(axis) > 0.99, name);
  }
  assert.ok(cameras.front.position.z > 0);
  assert.ok(cameras.side.position.x > 0);
  assert.ok(cameras.top.position.y > 0);
  assert.ok(screenUp(cameras.top).dot(new THREE.Vector3(0, 0, 1)) > 0.99);
  assert.ok(screenUp(cameras.front).dot(new THREE.Vector3(0, 1, 0)) > 0.99);
  assert.ok(screenUp(cameras.side).dot(new THREE.Vector3(0, 1, 0)) > 0.99);
});

test("a box fills its frame and sits in the middle", () => {
  const box = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 1, 0.2));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.2), new THREE.MeshBasicMaterial());
  mesh.position.copy(box.getCenter(new THREE.Vector3()));
  mesh.geometry.computeBoundingBox();
  const root = new THREE.Group();
  root.add(mesh);
  root.updateMatrixWorld(true);
  const view = shot.views("shape", "Egg");
  const camera = view.cameras.front;
  const center = new THREE.Box3().setFromObject(view.solo).getCenter(new THREE.Vector3()).project(camera);
  assert.ok(Math.abs(center.x) < 0.02, center.x);
  assert.ok(Math.abs(center.y) < 0.02, center.y);
  let peak = 0;
  const corner = new THREE.Vector3();
  view.solo.traverse(obj => {
    if (!obj.isMesh) return;
    obj.geometry.computeBoundingBox();
    const bb = obj.geometry.boundingBox;
    for (const x of [bb.min.x, bb.max.x]) {
      for (const y of [bb.min.y, bb.max.y]) {
        for (const z of [bb.min.z, bb.max.z]) {
          corner.copy(obj.localToWorld(new THREE.Vector3(x, y, z))).project(camera);
          assert.ok(Math.abs(corner.x) <= 1 && Math.abs(corner.y) <= 1);
          peak = Math.max(peak, Math.abs(corner.x), Math.abs(corner.y));
        }
      }
    }
  });
  assert.ok(peak > 0.8 && peak <= 1 / shot.MARGIN + 0.02, peak);
});

test("solo keeps the item, and context uses the stage camera", () => {
  const tool = shot.views("tool", "Wrench");
  const held = tool.solo.getObjectByName("held-tool");
  assert.equal(held.quaternion.x, 0);
  assert.equal(held.quaternion.y, 0);
  assert.equal(held.quaternion.z, 0);
  assert.equal(held.scale.x, 1);
  assert.equal(tool.solo.getObjectByName("body"), undefined);
  assert.equal(tool.context.rig.getObjectByName("body").name, "body");
  assert.ok(tool.context.rig.getObjectByName("held-tool"));
  assert.equal(tool.context.rig.getObjectByName("extra"), undefined);
  let place = null;
  tool.context.rig.traverse(obj => { if (obj.userData && obj.userData.place) place = obj.userData.place; });
  assert.equal(place.headTop, 2.32);

  const clothes = shot.views("clothes", "Suit");
  let mapped = false;
  clothes.solo.traverse(obj => { if (obj.isMesh && obj.material && obj.material.map) mapped = true; });
  assert.equal(mapped, true);
  assert.equal(clothes.solo.getObjectByName("body").name, "body");
  assert.equal(clothes.context.rig.getObjectByName("extra"), undefined);

  const extra = shot.views("extra", "Halo");
  assert.equal(extra.solo.getObjectByName("extra").name, "extra");
  assert.equal(extra.solo.getObjectByName("body"), undefined);
  assert.ok(extra.context.rig.getObjectByName("extra").parent.userData.place);
  assert.ok(extra.context.rig.getObjectByName("body"));
  const wings = shot.views("extra", "Small wings");
  assert.equal(wings.context.rig.getObjectByName("wing").parent.name, "extra");

  const peanut = shot.views("shape", "Peanut");
  assert.equal(peanut.solo.getObjectByName("body").name, "body");
  assert.equal(peanut.solo.getObjectByName("extra"), undefined);
  assert.equal(peanut.solo.getObjectByName("held-tool"), undefined);
  let elbows = 0;
  peanut.solo.traverse(obj => { if (obj.name === "elbow") elbows++; });
  assert.equal(elbows, 2);
  const visor = peanut.solo.children.find(child => child.isMesh && child.geometry && child.geometry.type === "SphereGeometry");
  assert.ok(visor);
  let peanutPlace = null;
  peanut.context.rig.traverse(obj => { if (obj.userData && obj.userData.place) peanutPlace = obj.userData.place; });
  assert.equal(peanutPlace.faceY, 1.76);

  const camera = tool.context.camera;
  camera.updateMatrixWorld(true);
  assert.deepEqual(camera.position.toArray().map(n => Math.round(n * 100) / 100), [1.55, 1.72, 3.95]);
  const toward = new THREE.Vector3(0, 1.2, 0).sub(camera.position).normalize();
  assert.ok(looking(camera).dot(toward) > 0.999);

  const inner = tool.context.rig.children[0];
  const world = new THREE.Box3().setFromObject(tool.context.rig.getObjectByName("body")).getCenter(new THREE.Vector3());
  assert.ok(Math.abs(world.x) < 1e-3);
  assert.ok(Math.abs(world.z) < 1e-3);
  assert.ok(Math.abs(world.y - bodyCenterY(inner)) < 1e-3);
});

test("an unknown item is rejected", () => {
  assert.throws(() => shot.views("tool", "None"), /unknown tool None/);
  assert.throws(() => shot.views("shape", "Wrench"), /unknown shape Wrench/);
});
