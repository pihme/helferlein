// The figure comes from the script-tag build (dist/helferlein.min.js), as on any host page.
import { blankStore, loadStore, saveStore } from "./store.js";

if (!globalThis.Helferlein) throw new Error("dist/helferlein.min.js did not load. Run npm run build.");
const { blankMemory, defaultLook, mount, rollFrom } = globalThis.Helferlein;

const GREETING = "Hi, I am Helferlein. Type a message below and I will act as if I am working on it.";
const THINKING = "Working on what you wrote. This pause is on purpose, so you can see the working pose. I am not calling a model.";
const THINKING_MORE = "Almost there. When I answer, I turn around. The page color changes while my back faces you, and that is when my look changes too.";
const REPLY = "This is a sample reply, not a live model.";
const THINK_FIRST_MS = 1800;
const THINK_TURN_MS = 5600;
const BACKGROUNDS = ["#f4efe6", "#e4eef8", "#f6e7e2", "#e5f3ea", "#f8f1d4", "#ece6f7"];

const stage = document.getElementById("stage");
const chat = document.getElementById("chat");
const log = document.getElementById("log");
const form = document.getElementById("talk");
const say = document.getElementById("say");
const summon = document.getElementById("summon");
let figure;
try {
  figure = mount(stage);
} catch (error) {
  const note = document.createElement("p");
  note.className = "boot-error";
  note.textContent = "Helferlein did not start. " + error;
  document.body.append(note);
  throw error;
}

let store = loadStore();
let thinkTimers = [];
let session = 0;
applyWash(store.background);

try {
  if (store.look && store.memory) figure.setBlob({ look: store.look, memory: store.memory });
} catch {
  store = blankStore();
  saveStore(store);
  figure.setBlob({ look: defaultLook(), memory: blankMemory() });
}
markLook();

function nextBackground(current) {
  const index = BACKGROUNDS.indexOf(current);
  return BACKGROUNDS[(index + 1 + BACKGROUNDS.length) % BACKGROUNDS.length];
}

function applyWash(color) {
  document.documentElement.style.setProperty("--wash", color);
}

function markLook() {
  const look = figure.getBlob().look;
  document.body.dataset.hue = String(look.hue);
  document.body.dataset.shape = look.shape;
  document.body.dataset.expression = look.expression;
  document.body.dataset.clothes = look.clothes;
  document.body.dataset.tool = look.tool;
  document.body.dataset.extra = look.extra;
}

function renderLog() {
  log.replaceChildren();
  for (const message of store.messages) {
    const item = document.createElement("div");
    item.className = message.from === "you" ? "msg msg-you" : "msg msg-agent";
    if (message.think) item.classList.add("msg-status");
    item.textContent = message.text;
    log.append(item);
  }
  log.scrollTop = log.scrollHeight;
}

function showChat(inputEnabled) {
  chat.hidden = false;
  document.body.classList.add("chat-open");
  summon.hidden = true;
  say.disabled = !inputEnabled;
  form.querySelector("button").disabled = !inputEnabled;
  renderLog();
  if (inputEnabled) say.focus();
}

function persist() {
  saveStore(store);
}

function openChat() {
  if (!chat.hidden) return;
  if (!store.messages.length) {
    store.messages = [{ from: "helferlein", text: GREETING }];
  }
  store.chatOpen = true;
  persist();
  showChat(true);
  figure.summon();
}

function clearThink() {
  thinkTimers.forEach(id => clearTimeout(id));
  thinkTimers = [];
}

function beginTurn() {
  clearThink();
  const turn = ++session;
  store.messages.push({ from: "helferlein", text: THINKING, think: true });
  showChat(false);
  figure.working();
  thinkTimers.push(window.setTimeout(() => {
    if (turn !== session) return;
    const thinking = store.messages.find(message => message.think);
    if (thinking) thinking.text = THINKING_MORE;
    renderLog();
  }, THINK_FIRST_MS));
  thinkTimers.push(window.setTimeout(() => {
    if (turn !== session) return;
    store.messages = store.messages.filter(message => !message.think);
    store.messages.push({ from: "helferlein", text: REPLY });
    showChat(false);
    const blob = figure.getBlob();
    const next = rollFrom(blob.look, blob.memory);
    figure.watchReveal(() => {
      if (turn !== session) return;
      const wash = nextBackground(store.background);
      store.look = next.look;
      store.memory = next.memory;
      store.pendingLook = null;
      store.pendingMemory = null;
      store.playSpin = false;
      store.returnFromBack = true;
      store.background = wash;
      store.chatOpen = true;
      applyWash(wash);
      persist();
      window.location.reload();
    });
    figure.applied({ look: next.look, memory: next.memory });
  }, THINK_FIRST_MS + THINK_TURN_MS));
}

stage.addEventListener("click", (event) => {
  if (event.target.closest("#summon")) return;
  openChat();
});
summon.addEventListener("click", openChat);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = say.value.trim();
  if (!text || say.disabled) return;
  say.value = "";
  store.messages.push({ from: "you", text });
  beginTurn();
});

document.getElementById("close").addEventListener("click", () => {
  clearThink();
  session += 1;
  figure.dismiss();
  const blob = figure.getBlob();
  store.look = blob.look;
  store.memory = blob.memory;
  store.pendingLook = null;
  store.pendingMemory = null;
  store.playSpin = false;
  store.returnFromBack = false;
  store.chatOpen = false;
  store.messages = [];
  persist();
  chat.hidden = true;
  document.body.classList.remove("chat-open");
  summon.hidden = false;
  markLook();
});

if (store.returnFromBack) {
  const turn = session;
  showChat(false);
  figure.returnFromBack().then(() => {
    if (turn !== session) return;
    store.returnFromBack = false;
    store.chatOpen = true;
    persist();
    showChat(true);
    markLook();
  });
} else if (store.playSpin && store.pendingLook && store.pendingMemory) {
  const turn = session;
  showChat(false);
  figure.applied({ look: store.pendingLook, memory: store.pendingMemory }).then(() => {
    if (turn !== session) return;
    const blob = figure.getBlob();
    store.look = blob.look;
    store.memory = blob.memory;
    store.pendingLook = null;
    store.pendingMemory = null;
    store.playSpin = false;
    store.chatOpen = true;
    persist();
    showChat(true);
    markLook();
  });
} else if (store.chatOpen) {
  showChat(true);
  figure.summon();
}
