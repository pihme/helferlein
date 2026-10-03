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

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// `reducedMotion: true | false` fixes the choice; left out, it follows the reader's
// prefers-reduced-motion setting, also when that setting changes while the page is open.
function motionPreference(options = {}, env = {}) {
  if (typeof options.reducedMotion === "boolean") {
    return { calm: options.reducedMotion, stop() {} };
  }
  const win = env.window || globalThis;
  const query = win && typeof win.matchMedia === "function" ? win.matchMedia(REDUCED_MOTION) : null;
  const pref = { calm: Boolean(query && query.matches), stop() {} };
  if (query && typeof query.addEventListener === "function") {
    const onChange = event => { pref.calm = Boolean(event.matches); };
    query.addEventListener("change", onChange);
    pref.stop = () => query.removeEventListener("change", onChange);
  }
  return pref;
}

const FALLBACK_SVG = '<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">'
  + '<path d="M16 3 C11 3 9 8 9 12 C9 15 11 16 11 18 L10 27 L22 27 L21 18 C21 16 23 15 23 12 C23 8 21 3 16 3Z" fill="var(--helferlein-body)" stroke="var(--helferlein-face)" stroke-width="1"/>'
  + '<rect x="11" y="8.5" width="10" height="5" rx="2.5" fill="var(--helferlein-face)"/></svg>';

function commitPending(state) {
  if (!state.turning || !state.pending) return { ...state, turning: false, pending: null, pendingMemory: null };
  return { ...state, look: state.pending, memory: state.pendingMemory, turning: false, pending: null, pendingMemory: null };
}

// Without WebGL the figure is a still silhouette in the look's colors. The host contract
// and the stored roll work the same: applied rolls and swaps the look at once.
function mountFallback(element, motion, doc, error) {
  const node = doc.createElement("div");
  node.className = "helferlein-fallback";
  node.setAttribute("role", "img");
  node.setAttribute("aria-label", "Helferlein");
  node.innerHTML = FALLBACK_SVG;
  node.style.setProperty("width", "100%");
  node.style.setProperty("height", "100%");
  element.appendChild(node);
  let state = fresh();
  let revealHook = null;

  function paint() {
    const { look } = state;
    const hsl = (s, l) => `hsl(${look.hue} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
    node.style.setProperty("--helferlein-body", hsl(look.bodyS, look.bodyL));
    node.style.setProperty("--helferlein-face", hsl(look.faceS, look.faceL));
    node.dataset.presence = state.presence;
    node.dataset.activity = state.activity === "summoned" ? "idle" : state.activity;
  }

  function reveal() {
    state = commitPending(state);
    paint();
    if (revealHook) {
      const fn = revealHook;
      revealHook = null;
      fn();
    }
    return Promise.resolve();
  }

  function act(action) {
    state = reduce(state, action);
    if (state.activity === "summoned") state = { ...state, activity: "idle" };
    paint();
    return state;
  }

  paint();
  return {
    webgl: false,
    error,
    get reducedMotion() {
      return motion.calm;
    },
    summon: () => act("summon"),
    working: () => act("working"),
    idle: () => act("idle"),
    applied(blob) {
      if (blob) {
        const next = readBlob(blob);
        if (state.presence !== "present") state = reduce(state, "summon");
        state = { ...state, presence: "present", activity: "idle", turning: true, pending: next.look, pendingMemory: next.memory };
        return reveal();
      }
      const wasTurning = state.turning;
      act("applied");
      return state.turning && !wasTurning ? reveal() : Promise.resolve();
    },
    watchReveal(fn) {
      revealHook = fn;
    },
    returnFromBack() {
      state = commitPending({ ...state, presence: "present", activity: "idle" });
      paint();
      return Promise.resolve();
    },
    dismiss: () => act("dismiss"),
    turn() {},
    setLook(partial) {
      state = { ...state, look: writeBlob({ ...state.look, ...partial }, state.memory).look, turning: false, pending: null, pendingMemory: null };
      paint();
    },
    getBlob: () => writeBlob(state.look, state.memory),
    setBlob(blob) {
      const next = readBlob(blob);
      state = { ...state, look: next.look, memory: next.memory, turning: false, pending: null, pendingMemory: null };
      paint();
    },
    dispose() {
      motion.stop();
      if (node.parentNode) node.parentNode.removeChild(node);
    }
  };
}

function mountWith(element, THREE, options = {}, env = {}) {
  if (!element) throw new TypeError("Helferlein: mount needs an element");
  if (!THREE || !THREE.WebGLRenderer) throw new Error("Helferlein: Three.js did not load");
  const doc = env.document || element.ownerDocument || globalThis.document;
  const now = env.now || (() => performance.now());
  const requestFrame = env.requestFrame || (fn => requestAnimationFrame(fn));
  const cancelFrame = env.cancelFrame || (id => cancelAnimationFrame(id));
  const motion = motionPreference(options, env);
  const ownCanvas = element.tagName !== "CANVAS";
  const canvas = ownCanvas ? doc.createElement("canvas") : element;
  if (ownCanvas) element.appendChild(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    if (ownCanvas && canvas.parentNode === element) element.removeChild(canvas);
    return mountFallback(ownCanvas ? element : (element.parentNode || element), motion, doc, error);
  }
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
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
  const draw = createDraw(THREE, env.createCanvas ? { createCanvas: env.createCanvas } : {});
  let state = fresh();
  let spin = null;
  let pose = { y: -0.22, s: 0.6 };
  let target = { y: -0.22, s: 0.6 };
  let drawnFace = "";
  let lastNow = 0;
  let earPlan = null;
  let raf = 0;

  // Reduced motion: a spin starts already finished, so the look changes in one frame.
  function spinStart() {
    return motion.calm ? now() - SPIN_MS : now();
  }

  function goal() {
    return state.presence === "present" ? { y: 0, s: 1 } : { y: -0.22, s: 0.6 };
  }

  function rebuild() {
    const look = screenLook(state, now(), motion.calm);
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
      spin = { t0: spinStart(), shown: false, pending: state.pending, memory: state.pendingMemory };
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
    spin = { t0: spinStart(), shown: false, pending: next.look, memory: next.memory };
    rebuild();
    pose = { ...goal() };
    target = { ...goal() };
    rig.position.y = pose.y;
    rig.scale.setScalar(Math.max(0.05, pose.s));
    return spinPromise();
  }

  function frame(stamp) {
    const t0 = env.now ? now() : stamp;
    const dt = lastNow ? Math.min(0.05, (t0 - lastNow) / 1000) : 0.016;
    lastNow = t0;
    const calm = motion.calm;
    const stepped = stepTurn(state, spin, t0);
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
    const faceNow = screenLook(state, t0, calm).expression;
    if (faceNow !== drawnFace) rebuild();
    const t = t0 / 1000;
    const present = state.presence === "present";
    const bobAmp = present && !calm ? (state.activity === "working" ? 0.05 : 0.028) : 0;
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
    if (calm) {
      pose.y = target.y;
      pose.s = target.s;
    } else {
      pose.y += (target.y - pose.y) * follow;
      pose.s += (target.s - pose.s) * follow;
    }
    rig.position.y = pose.y;
    rig.scale.setScalar(Math.max(0.05, pose.s));
    pivot.rotation.set(userPitch, stepped.yaw + userYaw, 0);
    inner.position.y = -pivotY + Math.sin(t * bobSpeed) * bobAmp;
    inner.rotation.x = !calm && !spin && present && state.activity === "working" ? Math.sin(t * 2.4) * 0.045 : 0;
    inner.rotation.z = !calm && !spin && present ? Math.sin(t * 1.15) * 0.028 : 0;
    // Reduced motion: the propeller and the dish stand still, wings and ears hold their rest angle.
    const live = calm ? 0 : 1;
    inner.traverse(obj => {
      if (obj.name === "propeller") obj.rotation.y += dt * 8 * live;
      if (obj.name === "antenna") obj.rotation.y += dt * 0.45 * live;
      if (obj.name === "wing") obj.rotation.y = obj.userData.back + beat * obj.userData.flap * live;
      if (obj.name === "ear") {
        obj.rotation.z = obj.userData.base + (obj.userData.side === earPlan.side ? earKick : 0) * obj.userData.amp * live;
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
    raf = requestFrame(frame);
  }

  rebuild();
  raf = requestFrame(frame);

  return {
    webgl: true,
    get reducedMotion() {
      return motion.calm;
    },
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
        t0: motion.calm ? spinStart() : now() - revealPortion() * SPIN_MS,
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
      cancelFrame(raf);
      motion.stop();
      clearGroup(inner);
      renderer.dispose();
      if (ownCanvas && canvas.parentNode === element) element.removeChild(canvas);
    }
  };
}

export { bodyCenterY, motionPreference, mountFallback, mountWith, screenPad };
