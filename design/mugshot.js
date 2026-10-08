// Four views of one catalog item. Front, side, and top frame the item on its own.
// A flat extra stands level in those views; the angle it is worn at stays in context.
// Context wears it on the default body (a body is shown as itself). The stage camera
// stays put while the figure fits, and backs up along that view when it would be cut off.
// A garment is a texture on the body, so on its own it is that shell.
import * as THREE from "three";
import { createDraw } from "../src/draw.js";
import { bodyCenterY } from "../src/figure.js";
import { CLOTHES, EXTRAS, SHAPES, TOOLS, defaultLook } from "../src/roll.js";

const MARGIN = 1.12;
const FOLDERS = { shape: "bodies", clothes: "clothes", tool: "tools", extra: "extras" };
const LISTS = { shape: SHAPES, clothes: CLOTHES, tool: TOOLS, extra: EXTRAS };
const PART = { clothes: "body", tool: "held-tool", extra: "extra" };

function slug(name) {
  return name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createMugshot(THREE, env) {
  const draw = createDraw(THREE, env);

  function items() {
    const out = [];
    for (const kind of Object.keys(FOLDERS)) {
      for (const name of LISTS[kind]) {
        if (name === "None") continue;
        out.push({ kind, name, folder: FOLDERS[kind], slug: slug(name) });
      }
    }
    return out;
  }

  function resolve(kind, name) {
    const key = String(name);
    const hit = items().filter(item => (!kind || item.kind === kind) && (item.name === key || item.slug === key));
    if (hit.length !== 1) throw new Error(`mugshot: unknown ${kind || "item"} ${name}`);
    return hit[0];
  }

  function lookFor(item) {
    const look = defaultLook();
    if (item.kind === "shape") look.shape = item.name;
    else look[item.kind] = item.name;
    return look;
  }

  function take(figure, item) {
    // A body shot is the shell with its face and its arms.
    if (item.kind === "shape") {
      figure.updateMatrixWorld(true);
      return figure;
    }
    const found = figure.getObjectByName(PART[item.kind]);
    if (!found) throw new Error(`mugshot: ${item.kind} ${item.name} has no ${PART[item.kind]}`);
    const root = new THREE.Group();
    root.add(found);
    // The grip is a pose on the held copy. Alone, the tool uses the axes it was built in.
    if (item.kind === "tool") {
      found.position.set(0, 0, 0);
      found.quaternion.identity();
      found.scale.set(1, 1, 1);
    }
    // The beret is built cocked onto the head. Alone, that disc stands level.
    if (item.kind === "extra") layLevel(root);
    root.updateMatrixWorld(true);
    return root;
  }

  // Local Y is the short axis of a flat piece. A thicker part is left as it was built.
  function layLevel(root) {
    root.updateMatrixWorld(true);
    let mesh = null;
    let verts = 0;
    root.traverse(obj => {
      if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes.position) return;
      const comps = [Math.abs(obj.scale.x), Math.abs(obj.scale.y), Math.abs(obj.scale.z)];
      const ordered = comps.slice().sort((a, b) => a - b);
      if (ordered[0] === 0 || ordered[0] / ordered[1] > 0.6) return;
      if (comps[1] !== ordered[0]) return;
      const count = obj.geometry.attributes.position.count;
      if (count > verts) {
        verts = count;
        mesh = obj;
      }
    });
    if (!mesh) return;
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion())).normalize();
    if (normal.y < 0) normal.negate();
    if (normal.y > 0.98) return;
    const up = new THREE.Vector3(0, 1, 0);
    const turn = new THREE.Quaternion().setFromUnitVectors(normal, up);
    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    root.quaternion.copy(turn);
    root.position.copy(center).sub(center.clone().applyQuaternion(turn));
    root.updateMatrixWorld(true);
  }

  function frameOne(box, dir, up) {
    const center = box.getCenter(new THREE.Vector3());
    const diag = Math.max(box.getSize(new THREE.Vector3()).length(), 1e-3);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, diag * 8);
    const direction = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    camera.up.set(up[0], up[1], up[2]);
    camera.position.copy(center).addScaledVector(direction, diag);
    camera.lookAt(center);
    camera.updateMatrixWorld(true);
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    const point = new THREE.Vector3();
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          min.min(point);
          max.max(point);
        }
      }
    }
    const midX = (min.x + max.x) / 2;
    const midY = (min.y + max.y) / 2;
    const half = Math.max(max.x - min.x, max.y - min.y, 1e-3) / 2 * MARGIN;
    camera.left = midX - half;
    camera.right = midX + half;
    camera.bottom = midY - half;
    camera.top = midY + half;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    return camera;
  }

  function frameSolo(root) {
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) throw new Error("mugshot: the item has no size");
    return {
      front: frameOne(box, [0, 0, 1], [0, 1, 0]),
      side: frameOne(box, [1, 0, 0], [0, 1, 0]),
      // The front, face included, points down the panel. Items with no face use this same up.
      top: frameOne(box, [0, 1, 0], [0, 0, -1])
    };
  }

  // Same seating as the live figure at idle: the body center stays on the stage camera's look height.
  function seat(figure) {
    const pivot = new THREE.Group();
    const inner = new THREE.Group();
    pivot.add(inner);
    inner.add(figure);
    const y = bodyCenterY(inner);
    const pivotY = y == null ? 1.2 : y;
    pivot.position.y = pivotY;
    inner.position.y = -pivotY;
    pivot.updateMatrixWorld(true);
    return pivot;
  }

  function worldPoints(root) {
    const points = [];
    const point = new THREE.Vector3();
    root.updateMatrixWorld(true);
    root.traverse(obj => {
      if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes.position) return;
      const position = obj.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i);
        points.push(obj.localToWorld(point.clone()));
      }
    });
    return points;
  }

  function framePeak(points, camera) {
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const point = new THREE.Vector3();
    let peak = 0;
    for (const world of points) {
      point.copy(world).applyMatrix4(camera.matrixWorldInverse);
      if (point.z > -camera.near) return Infinity;
      point.applyMatrix4(camera.projectionMatrix);
      peak = Math.max(peak, Math.abs(point.x), Math.abs(point.y));
    }
    return peak;
  }

  // Back up along the stage view until every vertex sits inside the solo margin.
  function stageView(rig) {
    const camera = draw.stageCamera();
    const points = worldPoints(rig);
    if (framePeak(points, camera) <= 1) return camera;
    const target = new THREE.Vector3(0, 1.2, 0);
    const offset = camera.position.clone().sub(target);
    const limit = 1 / MARGIN;
    const place = (scale) => {
      camera.position.copy(target).addScaledVector(offset, scale);
      camera.lookAt(target);
    };
    let lo = 1;
    let hi = 1.5;
    place(hi);
    while (framePeak(points, camera) > limit && hi < 8) {
      lo = hi;
      hi = Math.min(hi * 1.5, 8);
      place(hi);
      if (hi === 8) break;
    }
    for (let step = 0; step < 18; step++) {
      const mid = (lo + hi) / 2;
      place(mid);
      if (framePeak(points, camera) > limit) lo = mid;
      else hi = mid;
    }
    place(hi);
    return camera;
  }

  function views(kind, name) {
    const item = resolve(kind, name);
    const look = lookFor(item);
    const solo = take(draw.buildFigure(look, false, "idle"), item);
    const figure = draw.buildFigure(look, false, "idle");
    const rig = seat(figure);
    return { item, solo, cameras: frameSolo(solo), context: { rig, camera: stageView(rig) } };
  }

  return { items, views, MARGIN };
}

const PANEL = 512;
const LABEL = 40;
const CLEAR = 0xd5d0c6;
const WORDS = ["Front", "Side", "Top", "Context"];
const KIND = { shape: "Body", clothes: "Clothes", tool: "Tool", extra: "Extra" };

function boot() {
  const shot = createMugshot(THREE);
  const kindEl = document.querySelector("#kind");
  const itemEl = document.querySelector("#item");
  const sheet = document.querySelector("#sheet");
  const ctx = sheet.getContext("2d");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(CLEAR, 1);
  renderer.setScissorTest(true);

  const soloScene = new THREE.Scene();
  const contextScene = new THREE.Scene();
  soloScene.add(new THREE.HemisphereLight(0xfff4e8, 0x93a6bb, 0.75));
  const key = new THREE.DirectionalLight(0xfff8f1, 2.6);
  const fill = new THREE.DirectionalLight(0xd7e4f6, 0.8);
  const keyAt = new THREE.Object3D();
  const fillAt = new THREE.Object3D();
  key.target = keyAt;
  fill.target = fillAt;
  soloScene.add(key, fill, keyAt, fillAt);
  // Same four lights as the live figure.
  contextScene.add(new THREE.HemisphereLight(0xfff4e8, 0x93a6bb, 0.65));
  const stageKey = new THREE.DirectionalLight(0xfff8f1, 2.5);
  stageKey.position.set(2.6, 4.4, 3.4);
  contextScene.add(stageKey);
  const stageFill = new THREE.DirectionalLight(0xd7e4f6, 0.65);
  stageFill.position.set(-3.4, 1.8, 2.4);
  contextScene.add(stageFill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(-1.6, 3.4, -2.8);
  contextScene.add(rim);

  let current = null;

  function dispose(root) {
    root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      const list = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
      for (const material of list) {
        if (material.map) material.map.dispose();
        material.dispose();
      }
    });
  }

  function aimStudio(camera) {
    camera.updateMatrixWorld(true);
    key.position.set(1.4, 1.8, 1.2).applyMatrix4(camera.matrixWorld);
    keyAt.position.set(0, 0, -1).applyMatrix4(camera.matrixWorld);
    fill.position.set(-1.8, 0.4, 1).applyMatrix4(camera.matrixWorld);
    fillAt.position.set(0, 0, -1).applyMatrix4(camera.matrixWorld);
    key.target.updateMatrixWorld();
    fill.target.updateMatrixWorld();
  }

  function fillKinds() {
    for (const [value, label] of Object.entries(KIND)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      kindEl.append(option);
    }
  }

  function fillItems(kind, selected) {
    itemEl.replaceChildren();
    for (const item of shot.items()) {
      if (item.kind !== kind) continue;
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      if (item.name === selected || item.slug === selected) option.selected = true;
      itemEl.append(option);
    }
  }

  function paint(view) {
    if (current) {
      soloScene.remove(current.solo);
      contextScene.remove(current.context.rig);
      dispose(current.solo);
      dispose(current.context.rig);
    }
    current = view;
    soloScene.add(view.solo);
    contextScene.add(view.context.rig);
    const width = PANEL * 4;
    renderer.setSize(width, PANEL, false);
    const jobs = [
      [soloScene, view.cameras.front],
      [soloScene, view.cameras.side],
      [soloScene, view.cameras.top],
      [contextScene, view.context.camera]
    ];
    jobs.forEach(([scene, camera], index) => {
      if (scene === soloScene) aimStudio(camera);
      renderer.setViewport(index * PANEL, 0, PANEL, PANEL);
      renderer.setScissor(index * PANEL, 0, PANEL, PANEL);
      renderer.render(scene, camera);
    });
    sheet.width = width;
    sheet.height = PANEL + LABEL;
    ctx.fillStyle = "#d5d0c6";
    ctx.fillRect(0, 0, sheet.width, sheet.height);
    ctx.drawImage(renderer.domElement, 0, 0);
    ctx.fillStyle = "#1c2430";
    ctx.font = "600 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    WORDS.forEach((word, index) => {
      ctx.fillText(word, index * PANEL + PANEL / 2, PANEL + LABEL / 2);
    });
    document.title = `${KIND[view.item.kind]} · ${view.item.name}`;
    return sheet.toDataURL("image/png");
  }

  function show(kind, name) {
    fillItems(kind, name);
    kindEl.value = kind;
    return paint(shot.views(kind, itemEl.value));
  }

  fillKinds();
  kindEl.addEventListener("change", () => show(kindEl.value, ""));
  itemEl.addEventListener("change", () => show(kindEl.value, itemEl.value));

  const params = new URLSearchParams(location.search);
  const kind = params.get("kind") || "shape";
  const name = params.get("name") || "Android";
  try {
    const png = show(kind, name);
    window.__mugshotPng = params.get("capture") ? png : "";
    window.__mugshotError = "";
  } catch (error) {
    window.__mugshotPng = "";
    window.__mugshotError = error instanceof Error ? error.message : String(error);
  }
}

if (typeof document !== "undefined") boot();

export { createMugshot };
