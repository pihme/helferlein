import { readBlob } from "../src/blob.js";

const KEY = "helferlein-demo";

function blankStore() {
  return {
    look: null,
    memory: null,
    pendingLook: null,
    pendingMemory: null,
    playSpin: false,
    returnFromBack: false,
    background: "#f4efe6",
    chatOpen: false,
    messages: []
  };
}

function normalizeStore(raw) {
  const next = blankStore();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { store: next, keep: false };
  if (raw.look != null || raw.memory != null) {
    try {
      const blob = readBlob({ look: raw.look, memory: raw.memory });
      next.look = blob.look;
      next.memory = blob.memory;
    } catch {
      return { store: blankStore(), keep: false };
    }
  }
  if (typeof raw.background === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.background)) next.background = raw.background;
  next.playSpin = raw.playSpin === true;
  next.returnFromBack = raw.returnFromBack === true;
  next.chatOpen = raw.chatOpen === true;
  if (next.playSpin && raw.pendingLook && raw.pendingMemory) {
    try {
      const pending = readBlob({ look: raw.pendingLook, memory: raw.pendingMemory });
      next.pendingLook = pending.look;
      next.pendingMemory = pending.memory;
    } catch {
      next.playSpin = false;
    }
  }
  if (Array.isArray(raw.messages)) {
    next.messages = raw.messages.filter(message =>
      message && (message.from === "you" || message.from === "helferlein") && typeof message.text === "string"
    ).map(message => ({ from: message.from, text: message.text, think: message.think === true }));
  }
  return { store: next, keep: true };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankStore();
    const { store, keep } = normalizeStore(JSON.parse(raw));
    if (!keep) localStorage.removeItem(KEY);
    return store;
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* the page still boots */ }
    return blankStore();
  }
}

function saveStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export { blankStore, loadStore, normalizeStore, saveStore };
