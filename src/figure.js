import { readBlob, writeBlob } from "./blob.js";
import { createDraw } from "./draw.js";
import { fresh, reduce } from "./machine.js";
import { SPIN_MS, earFlick, revealPortion, screenLook, stepTurn } from "./motion.js";

// Pitch orbits the body. A hat, a tool, or the arms must not move that center.
function bodyCenterY(root) {
  const body = root.getObjectByName("body");
  if (!body) return null;
  root.updateWorldMatrix(true, true);
  let Box3 = null;
  let Vector3 = null;
  body.traverse(obj => {
    if (Box3 || !obj.isMesh || !obj.geometry) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    Box3 = obj.geometry.boundingBox.constructor;
    Vector3 = obj.geometry.boundingBox.min.constructor;
  });
  if (!Box3) return null;
  const inv = new root.matrixWorld.constructor().copy(root.matrixWorld).invert();
  const box = new Box3();
  const corner = new Vector3();
  body.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    const bb = obj.geometry.boundingBox;
    for (const x of [bb.min.x, bb.max.x]) {
      for (const y of [bb.min.y, bb.max.y]) {
        for (const z of [bb.min.z, bb.max.z]) {
          corner.set(x, y, z).applyMatrix4(obj.matrixWorld).applyMatrix4(inv);
          box.expandByPoint(corner);
        }
      }
    }
  });
  if (box.isEmpty()) return null;
  return (box.min.y + box.max.y) / 2;
}

// Fraction of the view below the lowest point, for the summoned pose.
// Inner-local space is that pose: scale 1, no tip, the pivot cancelled.
function screenPad(root, camera) {
  root.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
  const inv = new root.matrixWorld.constructor().copy(root.matrixWorld).invert();
  const point = new root.position.constructor();
  let maxF = -1;
  root.traverse(obj => {
    if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes.position) return;
    const pos = obj.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      point.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      point.applyMatrix4(obj.matrixWorld).applyMatrix4(inv);
      point.project(camera);
      const f = (1 - point.y) / 2;
      if (f > maxF) maxF = f;
    }
  });
  if (maxF < 0) return null;
  return 1 - maxF;
}

function clearGroup(group) {
  const mats = new Set();
  for (const child of [...group.children]) {
    child.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        list.forEach(material => mats.add(material));
      }
    });
    group.remove(child);
  }
  mats.forEach(material => {
    if (material.map) material.map.dispose();
    material.dispose();
  });
}

function mount(element, THREE) {
  if (!THREE || !THREE.WebGLRenderer) throw new Error("Three.js did not load");
  const canvas = element.tagName === "CANVAS" ? element : document.createElement("canvas");
  if (canvas.parentNode !== element) element.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(1.55, 1.72, 3.95);
  camera.lookAt(0, 1.2, 0);
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0x93a6bb, 0.65));
  const key = new THREE.DirectionalLight(0xfff8f1, 2.5);
  key.position.set(2.6, 4.4, 3.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd7e4f6, 0.65);
  fill.position.set(-3.4, 1.8, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(-1.6, 3.4, -2.8);
  scene.add(rim);
  const rig = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.rotation.order = "YXZ";
  const inner = new THREE.Group();
  pivot.add(inner);
  rig.add(pivot);
  scene.add(rig);
  let pivotY = 1.2;
  const draw = createDraw(THREE);
  let state = fresh();
  let spin = null;
  let pose = { y: -0.22, s: 0.6 };
  let target = { y: -0.22, s: 0.6 };
  let drawnFace = "";
  let lastNow = 0;
  let earPlan = null;
  let raf = 0;

  function goal() {
    return state.presence === "present" ? { y: 0, s: 1 } : { y: -0.22, s: 0.6 };
  }

  function rebuild() {
    const look = screenLook(state, performance.now());
    drawnFace = look.expression;
    clearGroup(inner);
    const activity = state.presence === "present" ? state.activity : "idle";
    inner.add(draw.buildFigure(look, state.presence !== "present", activity));
    seatPivot();
    const pad = screenPad(inner, camera);
    if (pad != null && element.style) element.style.setProperty("--mesh-pad", pad.toFixed(4));
    target = goal();
  }

  function seatPivot() {
    const y = bodyCenterY(inner);
    if (y != null) pivotY = y;
    pivot.position.y = pivotY;
  }

  let spinWait = null;
  let revealHook = null;
  const pitchLimit = 70 * Math.PI / 180;
  let userYaw = 0;
  let userPitch = 0;

  function finishSpin() {
    if (!spinWait) return;
    const resolve = spinWait;
    spinWait = null;
    resolve();
  }

  function fireReveal() {
    if (!revealHook) return;
    const fn = revealHook;
    revealHook = null;
    fn();
  }

  function spinPromise() {
    return new Promise(resolve => { spinWait = resolve; });
  }

  function act(action) {
    const prevTurning = state.turning;
    const next = reduce(state, action);
    state = next;
    if (action === "dismiss") {
      spin = null;
      revealHook = null;
      finishSpin();
    }
    if (action === "applied" && state.turning && !prevTurning) {
      spin = { t0: performance.now(), shown: false, pending: state.pending, memory: state.pendingMemory };
    }
    if (next.changed || action === "dismiss" || (action === "applied" && state.turning)) rebuild();
    return state;
  }

  function revealBlob(blob) {
    const next = readBlob(blob);
    if (state.presence !== "present") state = reduce(state, "summon");
    state = {
      ...state,
      presence: "present",
      activity: "idle",
      turning: true,
      pending: next.look,
      pendingMemory: next.memory,
      changed: "look"
    };
    spin = { t0: performance.now(), shown: false, pending: next.look, memory: next.memory };
    rebuild();
    pose = { ...goal() };
    target = { ...goal() };
    rig.position.y = pose.y;
    rig.scale.setScalar(Math.max(0.05, pose.s));
    return spinPromise();
  }

  function frame(now) {
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    const stepped = stepTurn(state, spin, now);
    state = stepped.state;
    spin = stepped.spin;
    if (!spin) finishSpin();
    if (stepped.rebuilt) {
      rebuild();
      fireReveal();
    }
    if (state.activity === "summoned" && Math.abs(pose.s - target.s) < 0.03) {
      state = { ...state, activity: "idle", last: "Idle.", changed: "" };
    }
    const faceNow = screenLook(state, now).expression;
    if (faceNow !== drawnFace) rebuild();
    const t = now / 1000;
    const present = state.presence === "present";
    const bobAmp = present ? (state.activity === "working" ? 0.05 : 0.028) : 0;
    const bobSpeed = state.activity === "working" ? 6.2 : 2.05;
    const follow = 1 - Math.pow(0.0015, dt);
    if (!earPlan) earPlan = { t0: t - 1, side: Math.random() < 0.5 ? -1 : 1, gap: 6 + Math.random() * 8 };
    if (t >= earPlan.t0 + earPlan.gap) {
      earPlan.t0 = t;
      earPlan.side = Math.random() < 0.5 ? -1 : 1;
      earPlan.gap = 6 + Math.random() * 8;
    }
    const earKick = earFlick(t - earPlan.t0);
    const beat = Math.sin(t * 2.8);
    pose.y += (target.y - pose.y) * follow;
    pose.s += (target.s - pose.s) * follow;
    rig.position.y = pose.y;
    rig.scale.setScalar(Math.max(0.05, pose.s));
    pivot.rotation.set(userPitch, stepped.yaw + userYaw, 0);
    inner.position.y = -pivotY + Math.sin(t * bobSpeed) * bobAmp;
    inner.rotation.x = !spin && present && state.activity === "working" ? Math.sin(t * 2.4) * 0.045 : 0;
    inner.rotation.z = !spin && present ? Math.sin(t * 1.15) * 0.028 : 0;
    inner.traverse(obj => {
      if (obj.name === "propeller") obj.rotation.y += dt * 8;
      if (obj.name === "antenna") obj.rotation.y += dt * 0.45;
      if (obj.name === "wing") obj.rotation.y = obj.userData.back + beat * obj.userData.flap;
      if (obj.name === "ear") {
        obj.rotation.z = obj.userData.base + (obj.userData.side === earPlan.side ? earKick : 0) * obj.userData.amp;
      }
    });
    const w = element.clientWidth || canvas.clientWidth;
    const h = element.clientHeight || canvas.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  rebuild();
  raf = requestAnimationFrame(frame);

  return {
    summon: () => act("summon"),
    working: () => act("working"),
    idle: () => act("idle"),
    applied: (blob) => {
      if (blob) return revealBlob(blob);
      const wasTurning = state.turning;
      act("applied");
      if (state.turning && !wasTurning) return spinPromise();
      return Promise.resolve();
    },
    watchReveal(fn) {
      revealHook = fn;
    },
    returnFromBack() {
      state = {
        ...state,
        presence: "present",
        activity: "idle",
        turning: true,
        pending: null,
        pendingMemory: null,
        changed: ""
      };
      pose = { y: 0, s: 1 };
      target = { y: 0, s: 1 };
      rig.position.y = 0;
      rig.scale.setScalar(1);
      spin = {
        t0: performance.now() - revealPortion() * SPIN_MS,
        shown: true,
        pending: state.look,
        memory: state.memory
      };
      return spinPromise();
    },
    dismiss: () => act("dismiss"),
    turn(yawDelta, pitchDelta = 0) {
      userYaw += yawDelta;
      userPitch = Math.min(pitchLimit, Math.max(-pitchLimit, userPitch + pitchDelta));
    },
    setLook(partial) {
      const look = writeBlob({ ...state.look, ...partial }, state.memory).look;
      state = { ...state, look, pending: null, pendingMemory: null, turning: false };
      spin = null;
      finishSpin();
      rebuild();
    },
    getBlob: () => writeBlob(state.look, state.memory),
    setBlob(blob) {
      const next = readBlob(blob);
      state = { ...state, look: next.look, memory: next.memory, pending: null, pendingMemory: null, turning: false };
      spin = null;
      finishSpin();
      rebuild();
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearGroup(inner);
      renderer.dispose();
    }
  };
}

export { bodyCenterY, mount, screenPad };
