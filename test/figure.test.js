import assert from "node:assert/strict";
import test from "node:test";
import { catalogBuilder, catalogNames } from "../src/catalog.js";
import { bindCatalog } from "../src/draw.js";
import * as THREE from "three";
import { bodyCenterY, mountWith, screenPad } from "../src/figure.js";
import { fresh, reduce } from "../src/machine.js";
import { SOCKETS, earFlick, screenLook, stepTurn } from "../src/motion.js";
import { SHAPES, TOOLS, defaultLook } from "../src/roll.js";


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

const draw = bindCatalog(THREE, { createCanvas });

function namesOf(group) {
  const names = [];
  group.traverse(obj => { if (obj.name) names.push(obj.name); });
  return names;
}

function finitePoint(point) {
  assert.equal(point.length, 3);
  for (const n of point) assert.equal(Number.isFinite(n), true);
}

test("every catalog part builds one group", () => {
  assert.equal(typeof mountWith, "function");
  for (const kind of ["shape", "clothes", "tool", "extra"]) {
    for (const name of catalogNames(kind)) {
      const group = catalogBuilder(kind, name)();
      assert.equal(group.isGroup, true, `${kind} ${name}`);
      for (const key of SOCKETS) finitePoint(group.userData.sockets[key]);
    }
  }
});

test("body sockets keep the prototype measurements", () => {
  const android = catalogBuilder("shape", "Android")();
  assert.deepEqual(android.userData.sockets.headTop, [0, 2.32, 0]);
  assert.deepEqual(android.userData.sockets.back, [0, 1.16, -0.06]);
  assert.deepEqual(android.userData.sockets.shoulderRight, [0.4 * 0.92 + 0.02, 1.16, 0.04]);
  assert.ok(android.userData.sockets.earLeft[0] < 0);
  assert.ok(android.userData.sockets.earRight[0] > 0);

  const rocket = catalogBuilder("shape", "Rocket")();
  assert.equal(rocket.userData.place.faceY, 1.6);
  assert.equal(rocket.userData.place.faceR, 0.26);
  assert.equal(rocket.userData.place.headTop, 2.14);

  const snow = catalogBuilder("shape", "Snowman")();
  assert.equal(snow.userData.place.faceZ, 0.28);

  const bulb = catalogBuilder("shape", "Lightbulb")();
  const bulbBody = bulb.getObjectByName("body");
  let socket = null;
  let coils = 0;
  let torus = 0;
  bulbBody.traverse(obj => {
    if (!obj.isMesh) return;
    const p = obj.geometry && obj.geometry.parameters;
    if (p && p.radiusTop === 0.128 && p.height === 0.2) socket = obj;
    if (obj.geometry.type === "BufferGeometry") coils += 1;
    if (obj.geometry.type === "TorusGeometry") torus += 1;
  });
  assert.ok(socket);
  assert.equal(socket.position.y, 0.95);
  assert.equal(coils, 2);
  assert.equal(torus, 0);
});

test("a pointed body seats the dish foot and the hat on its own surface", () => {
  const look = defaultLook();
  look.shape = "Rocket";
  look.extra = "Antenna";
  const rocket = draw.buildFigure(look, false, "idle");
  assert.equal(rocket.userData.sockets.classic, false);
  assert.ok(rocket.userData.sockets.hatTop > 1.8, "hat sits on the cone");
  assert.ok(rocket.userData.sockets.hatTop < rocket.userData.place.headTop);
  look.shape = "Teardrop";
  const drop = draw.buildFigure(look, false, "idle");
  let foot = null;
  drop.getObjectByName("extra").children.forEach(child => {
    const p = child.geometry && child.geometry.parameters;
    if (p && p.radiusTop === 0.055 * drop.userData.sockets.hatScale) foot = child;
  });
  assert.ok(foot);
  const half = foot.geometry.parameters.height / 2;
  assert.ok(foot.position.y - half < drop.userData.sockets.meshTop);
  assert.ok(foot.position.y + half > drop.userData.sockets.meshTop);
});

function frontProfile(mesh) {
  const pos = mesh.geometry.attributes.position;
  const samples = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * (mesh.scale.x || 1);
    const y = mesh.position.y + pos.getY(i) * (mesh.scale.y || 1);
    const z = pos.getZ(i) * (mesh.scale.z || 1);
    const radius = Math.hypot(x, z);
    if (z > 0 && Math.abs(x) <= radius * 0.25) samples.push([radius, y]);
  }
  return samples;
}

function widest(samples, y0, y1) {
  let best = 0;
  for (const [radius, y] of samples) {
    if (y >= y0 && y < y1 && radius > best) best = radius;
  }
  return best;
}

test("smoother bodies keep the eight silhouettes", () => {
  const android = frontProfile(catalogBuilder("shape", "Android")().children[0].children[0]);
  assert.ok(android.length > 40);
  assert.ok(widest(android, 1.6, 2.05) > widest(android, 1.05, 1.4));
  assert.ok(Math.max(...android.map(([, y]) => y)) > 2.2);

  const peanut = frontProfile(catalogBuilder("shape", "Peanut")().children[0].children[0]);
  const pinch = widest(peanut, 1.18, 1.36);
  assert.ok(pinch < widest(peanut, 0.7, 1.05));
  assert.ok(pinch < widest(peanut, 1.6, 1.9));

  const pear = frontProfile(catalogBuilder("shape", "Pear")().children[0].children[0]);
  assert.ok(widest(pear, 0.7, 1.2) > widest(pear, 1.55, 1.95));
  assert.ok(widest(pear, 1.88, 2.05) < widest(pear, 1.7, 1.86));

  const egg = catalogBuilder("shape", "Egg")().children[0];
  assert.equal(egg.children.filter(child => child.isMesh).length, 1);
  assert.equal(egg.children[0].geometry.type, "SphereGeometry");

  const drop = frontProfile(catalogBuilder("shape", "Teardrop")().children[0].children[0]);
  assert.ok(widest(drop, 1.75, 2.1) < widest(drop, 0.8, 1.2));

  const snow = catalogBuilder("shape", "Snowman")().children[0].children.filter(child => child.isMesh);
  const radii = snow.map(mesh => mesh.geometry.parameters.radius).sort((a, b) => b - a);
  assert.deepEqual(radii, [0.5, 0.36, 0.24]);
  const lowest = snow.reduce((best, mesh) => mesh.position.y < best.position.y ? mesh : best);
  assert.equal(lowest.geometry.parameters.radius, 0.5);

  const rocket = catalogBuilder("shape", "Rocket")().children[0];
  const kinds = rocket.children.filter(child => child.isMesh).map(mesh => mesh.geometry.type);
  assert.ok(kinds.includes("CylinderGeometry"));
  assert.ok(kinds.includes("ConeGeometry"));
  assert.equal(kinds.filter(kind => kind === "BoxGeometry").length, 0);
  assert.equal(kinds.filter(kind => kind === "BufferGeometry").length, 3);
  const nose = rocket.children.find(child => child.geometry && child.geometry.type === "ConeGeometry");
  assert.equal(nose.geometry.parameters.openEnded, true);
});

test("a garment paints the android, and a sealed figure wears nothing", () => {
  let mapped = false;
  catalogBuilder("clothes", "Pleated shirt")().traverse(obj => {
    if (obj.isMesh && obj.material && obj.material.map) mapped = true;
  });
  assert.equal(mapped, true);
  mapped = false;
  catalogBuilder("clothes", "None")().traverse(obj => {
    if (obj.isMesh && obj.material && obj.material.map) mapped = true;
  });
  assert.equal(mapped, false);

  const look = defaultLook();
  look.extra = "Small wings";
  look.tool = "Wrench";
  const sealed = draw.buildFigure(look, true, "idle");
  const names = namesOf(sealed);
  assert.equal(names.includes("wing"), false);
  assert.equal(names.includes("held-tool"), false);
});

test("two bones reach the hand and the working arm lifts", () => {
  const handOf = (fig, side) => {
    let found = null;
    fig.updateMatrixWorld(true);
    fig.traverse(obj => {
      if (obj.name === "elbow" && obj.userData.side === side) found = obj;
    });
    const hand = new THREE.Vector3();
    found.children[found.children.length - 1].getWorldPosition(hand);
    fig.worldToLocal(hand);
    return hand;
  };
  for (const shape of SHAPES) {
    const look = defaultLook();
    look.shape = shape;
    look.tool = "None";
    const idle = draw.buildFigure(look, false, "idle");
    for (const side of [-1, 1]) {
      const key = side < 0 ? "handLeft" : "handRight";
      const shoulder = side < 0 ? "shoulderLeft" : "shoulderRight";
      const hand = handOf(idle, side);
      const socket = idle.userData.sockets[key];
      assert.ok(Math.hypot(hand.x - socket[0], hand.y - socket[1], hand.z - socket[2]) < 0.03, shape);
      assert.ok(socket[1] < idle.userData.sockets[shoulder][1] - 0.25, shape);
    }
    let elbows = [];
    idle.traverse(obj => { if (obj.name === "elbow") elbows.push(obj); });
    assert.equal(elbows.length, 2, shape);
    const right = new THREE.Vector3();
    elbows.find(obj => obj.userData.side > 0).getWorldPosition(right);
    idle.worldToLocal(right);
    assert.ok(right.x > idle.userData.sockets.shoulderRight[0] + 0.04, shape);
    const working = draw.buildFigure(look, false, "working");
    assert.ok(working.userData.sockets.handRight[1] > working.userData.sockets.shoulderRight[1] - 0.05, shape);
    assert.ok(working.userData.sockets.handLeft[1] < working.userData.sockets.shoulderLeft[1] - 0.25, shape);
  }
});

test("each tool sits in the right fist and points the way the hold note says", () => {
  const expectHold = {
    "Wrench": { along: "forearm", reach: "forward" },
    "Pencil": { along: "forearm", reach: "down" },
    "Magnifying glass": { aim: [0, 1, 0], reach: "forward" },
    "Brush": { aim: [0, -1, 0], reach: "down" },
    "Clipboard": { aim: [0, 1, 0], face: [0, 0, 1], reach: "forward" },
    "Watering can": { aim: [0, -1, 0], reach: "forward", beside: 0.12 },
    "Telescope": { aim: [0.78, 0.02, 0.62], min: 0.95, reach: "raised" },
    "Hammer": { along: "forearm", face: [0, -1, 0], reach: "forward" },
    "Saw": { along: "forearm", face: [0, -1, 0], reach: "forward" },
    "Fairy wand": { aim: [0.84, 0.2, 0.5], min: 0.95, face: [0.84, 0.2, 0.5], reach: "raised" },
    "Scissors": { along: "forearm", face: [0, 1, 0], reach: "forward" },
    "Tongs": { aim: [0, -1, 0], reach: "down" }
  };
  const dirBetween = (fig, tool, from, to) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    tool.localToWorld(a);
    tool.localToWorld(b);
    fig.worldToLocal(a);
    fig.worldToLocal(b);
    return b.sub(a).normalize();
  };
  for (const shape of SHAPES) {
    for (const name of TOOLS) {
      if (name === "None" || !expectHold[name]) continue;
      const spec = expectHold[name];
      const look = defaultLook();
      look.shape = shape;
      look.tool = name;
      const fig = draw.buildFigure(look, false, "idle");
      let tool = null;
      let elbow = null;
      fig.traverse(obj => {
        if (obj.name === "held-tool") tool = obj;
        if (obj.name === "elbow" && obj.userData.side > 0) elbow = obj;
      });
      assert.ok(tool, `${shape} ${name} mesh`);
      assert.ok(elbow, `${shape} ${name} right elbow`);
      let owner = tool.parent;
      let owned = false;
      while (owner) {
        if (owner === elbow) owned = true;
        owner = owner.parent;
      }
      assert.equal(owned, true, `${shape} ${name} stays in the right hand`);
      const handMesh = elbow.children.filter(child => child.isMesh).sort((a, b) => a.position.y - b.position.y)[0];
      const hand = new THREE.Vector3();
      const origin = new THREE.Vector3();
      handMesh.getWorldPosition(hand);
      elbow.getWorldPosition(origin);
      fig.worldToLocal(hand);
      fig.worldToLocal(origin);
      const forearm = hand.clone().sub(origin).normalize();
      const grip = new THREE.Vector3(...tool.userData.grip);
      tool.localToWorld(grip);
      fig.worldToLocal(grip);
      assert.ok(grip.distanceTo(hand) < 0.04, `${shape} ${name} grip is in the fist`);
      const aim = dirBetween(fig, tool, tool.userData.aimFrom, tool.userData.aimTo);
      if (spec.along === "forearm") {
        assert.ok(aim.dot(forearm) > 0.9, `${shape} ${name} follows the forearm ${aim.dot(forearm)}`);
      } else {
        const want = new THREE.Vector3(...spec.aim).normalize();
        assert.ok(aim.dot(want) > (spec.min || 0.9), `${shape} ${name} aim ${aim.dot(want)}`);
      }
      if (spec.face) {
        const face = dirBetween(fig, tool, tool.userData.faceFrom, tool.userData.faceTo);
        const want = new THREE.Vector3(...spec.face);
        assert.ok(face.dot(want) > 0.8, `${shape} ${name} face ${face.dot(want)}`);
      }
      if (spec.crownAbove) {
        const body = new THREE.Vector3(...tool.userData.bodyAt);
        const crown = new THREE.Vector3(...tool.userData.crownAt);
        tool.localToWorld(body);
        tool.localToWorld(crown);
        fig.worldToLocal(body);
        fig.worldToLocal(crown);
        assert.ok(crown.y > body.y + spec.crownAbove, `${shape} can hangs below the fist`);
      }
      if (spec.beside) {
        const body = new THREE.Vector3(...tool.userData.bodyAt);
        const crown = new THREE.Vector3(...tool.userData.crownAt);
        tool.localToWorld(body);
        tool.localToWorld(crown);
        fig.worldToLocal(body);
        fig.worldToLocal(crown);
        assert.ok(crown.distanceTo(body) > spec.beside, `${shape} fist is on the side of the can`);
      }
      const shoulder = fig.userData.sockets.shoulderRight;
      const socket = fig.userData.sockets.handRight;
      if (spec.reach === "forward") {
        assert.ok(socket[2] > shoulder[2] + 0.2, `${shape} ${name} reaches forward`);
        assert.ok(socket[1] > shoulder[1] - 0.15, `${shape} ${name} does not hang`);
      } else if (spec.reach === "down") {
        assert.ok(socket[1] < shoulder[1] - 0.2, `${shape} ${name} hand is down`);
        assert.ok(socket[2] > shoulder[2] + 0.08, `${shape} ${name} still reaches`);
      } else {
        assert.ok(socket[1] > shoulder[1] + 0.2, `${shape} ${name} arm is raised`);
      }
      assert.ok(socket[0] > shoulder[0] - 0.2, `${shape} ${name} hand stays on the right`);
      assert.ok(fig.userData.sockets.handLeft[1] < fig.userData.sockets.shoulderLeft[1] - 0.25, `${shape} ${name} left arm hangs`);
      if (spec.reach === "down" && spec.along === "forearm") {
        assert.ok(forearm.y < -0.5, `${shape} ${name} forearm points down`);
        assert.ok(forearm.z > 0.25, `${shape} ${name} forearm also reaches`);
      }
    }
  }
  const look = defaultLook();
  look.tool = "Wrench";
  const working = draw.buildFigure(look, false, "working");
  assert.ok(working.userData.sockets.handRight[0] > working.userData.sockets.shoulderRight[0]);
  assert.ok(working.userData.sockets.handLeft[1] < working.userData.sockets.shoulderLeft[1] - 0.25);
});

test("tools and extras keep the prototype anchors", () => {
  const wrench = catalogBuilder("tool", "Wrench")();
  assert.equal(namesOf(wrench).includes("held-tool"), true);
  const wings = catalogBuilder("extra", "Small wings")();
  const backs = [];
  wings.traverse(obj => {
    if (obj.name === "wing") backs.push(obj.userData.back);
  });
  backs.sort((a, b) => a - b);
  assert.deepEqual(backs, [-0.45, -0.45, 0.45, 0.45]);
  assert.equal(namesOf(catalogBuilder("extra", "Antenna")()).includes("antenna"), true);
  assert.equal(namesOf(catalogBuilder("extra", "Propeller")()).includes("propeller"), true);
  assert.equal(namesOf(catalogBuilder("extra", "Bunny ears")()).includes("ear"), true);
});

test("half a turn faces the back toward the stage camera", () => {
  const camera = draw.stageCamera();
  camera.updateMatrixWorld(true);
  const ahead = new THREE.Vector3();
  camera.getWorldDirection(ahead);
  assert.ok(camera.position.x > 0);
  assert.ok(camera.position.z > 0);
  assert.ok(ahead.z < 0);
  const rig = new THREE.Group();
  const marker = new THREE.Object3D();
  marker.position.set(0, 0, 1);
  rig.add(marker);
  rig.rotation.y = Math.PI;
  rig.updateMatrixWorld(true);
  const world = new THREE.Vector3();
  marker.getWorldPosition(world);
  assert.ok(world.z < 0);
});

test("the spin reveals on the back-facing half turn, and the working face pulses", () => {
  let state = reduce(reduce(reduce(fresh(), "summon"), "idle"), "working");
  state = reduce(state, "applied");
  const pendingHue = state.pending.hue;
  const spin = { t0: 0, shown: false, pending: state.pending, memory: state.pendingMemory };
  const early = stepTurn(state, spin, 240);
  assert.equal(early.state.look.hue, state.look.hue);
  assert.equal(early.spin.shown, false);
  const mid = stepTurn(state, spin, 252);
  assert.equal(mid.rebuilt, true);
  assert.equal(mid.state.look.hue, pendingHue);
  assert.equal(mid.state.pending, null);
  const done = stepTurn(mid.state, mid.spin, 1200);
  assert.equal(done.spin, null);
  assert.equal(done.state.turning, false);
  assert.equal(done.yaw, 0);

  const working = { ...fresh(), presence: "present", activity: "working", turning: false };
  assert.equal(screenLook(working, 0).expression, "Focused");
  assert.equal(screenLook(working, 450).expression, "Determined");
  assert.equal(screenLook(working, 900).expression, "Focused");
  assert.equal(screenLook(fresh(), 0).expression, "Resting");
  assert.equal(earFlick(0.09) > 0, true);
  assert.equal(earFlick(1), 0);
});

test("a clothed triangle stays on one side of the back seam", () => {
  for (const shape of SHAPES) {
    for (const clothes of catalogNames("clothes")) {
      if (clothes === "None") continue;
      const look = defaultLook();
      look.shape = shape;
      look.clothes = clothes;
      const fig = draw.buildFigure(look, false, "idle");
      fig.traverse(mesh => {
        if (!mesh.isMesh || !mesh.material || !mesh.material.map) return;
        const uv = mesh.geometry.attributes.uv;
        const count = mesh.geometry.attributes.position.count;
        assert.equal(mesh.geometry.index, null, `${shape} ${clothes}`);
        for (let i = 0; i < count; i += 3) {
          const span = Math.max(uv.getX(i), uv.getX(i + 1), uv.getX(i + 2))
            - Math.min(uv.getX(i), uv.getX(i + 1), uv.getX(i + 2));
          assert.ok(span < 0.5, `${shape} ${clothes} span ${span.toFixed(3)}`);
        }
      });
    }
  }
});

test("pitch stays on the body when the extras change", () => {
  const look = defaultLook();
  look.shape = "Snowman";
  look.clothes = "T-shirt";
  const plain = draw.buildFigure(look, false, "idle");
  const y = bodyCenterY(plain);
  assert.ok(y > 0.8 && y < 1.4, String(y));
  look.extra = "Antlers";
  look.tool = "Fairy wand";
  const dressed = draw.buildFigure({ ...look }, false, "idle");
  assert.ok(Math.abs(bodyCenterY(dressed) - y) < 1e-6);
  dressed.rotation.x = 50 * Math.PI / 180;
  assert.ok(Math.abs(bodyCenterY(dressed) - y) < 1e-4);
  const whole = new THREE.Box3().setFromObject(dressed);
  const wholeY = (whole.min.y + whole.max.y) / 2;
  assert.ok(Math.abs(wholeY - y) > 0.05, `whole ${wholeY} body ${y}`);
});

test("the summoned figure keeps a lower margin that depends on the body", () => {
  const camera = draw.stageCamera();
  camera.aspect = 1.4;
  camera.updateProjectionMatrix();
  const snow = defaultLook();
  snow.shape = "Snowman";
  const snowPad = screenPad(draw.buildFigure(snow, false, "idle"), camera);
  assert.ok(snowPad > 0.1 && snowPad < 0.18, String(snowPad));
  const android = defaultLook();
  android.shape = "Android";
  const androidPad = screenPad(draw.buildFigure(android, false, "idle"), camera);
  assert.ok(androidPad > snowPad, String(androidPad));
});
