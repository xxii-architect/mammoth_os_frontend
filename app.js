// app.js - Full frontend replacement with Lesson Progression, Complete button, and safe boot chime
const API = "http://127.0.0.1:8000";

/* ---------------------------
   Local State (frontend cache)
   --------------------------- */
let localState = {
  revenue: 0,
  orders: 0,
  current_lesson: "Week 1",
  streak: 0,
  xp: 0,
  moduleIndex: 0,
  sectionIndex: 0,
  lessonIndex: 0
};

let loadedFromBackend = false;
let lastSavedAt = null;

/* ---------------------------
   Lesson Progression Engine (curriculum with content & XP)
   --------------------------- */
const curriculum = [
  {
    id: "module-1",
    title: "Foundations",
    sections: [
      {
        id: "m1s1",
        title: "Intro",
        lessons: [
          { title: "Welcome", content: "Welcome to Mammoth OS — your learning journey begins.", xp: 10 },
          { title: "Setup", content: "Install tools, configure environment, and run the demo.", xp: 15 },
          { title: "Philosophy", content: "Why we build agents: autonomy, safety, and usefulness.", xp: 10 }
        ]
      },
      {
        id: "m1s2",
        title: "Basics",
        lessons: [
          { title: "Variables", content: "Variables store data. Practice with examples.", xp: 8 },
          { title: "Control Flow", content: "Ifs, loops, and functions — the building blocks.", xp: 12 }
        ]
      }
    ]
  },
  {
    id: "module-2",
    title: "Agents",
    sections: [
      {
        id: "m2s1",
        title: "Agent Basics",
        lessons: [
          { title: "Agent Anatomy", content: "Agents have sensors, actuators, and policies.", xp: 15 },
          { title: "Agent Loop", content: "Sense → Plan → Act. Implement a simple loop.", xp: 15 }
        ]
      },
      {
        id: "m2s2",
        title: "Coordination",
        lessons: [
          { title: "Message Bus", content: "Agents communicate via messages and events.", xp: 12 },
          { title: "Orchestration", content: "Coordinating multiple agents for complex tasks.", xp: 18 }
        ]
      }
    ]
  },
  {
    id: "module-3",
    title: "Advanced",
    sections: [
      {
        id: "m3s1",
        title: "Scaling",
        lessons: [
          { title: "Sharding", content: "Split work across nodes to scale horizontally.", xp: 20 },
          { title: "Caching", content: "Use caching to reduce latency and load.", xp: 12 }
        ]
      }
    ]
  }
];

/* Ensure progression fields exist */
if (typeof localState.moduleIndex === "undefined") localState.moduleIndex = 0;
if (typeof localState.sectionIndex === "undefined") localState.sectionIndex = 0;
if (typeof localState.lessonIndex === "undefined") localState.lessonIndex = 0;

/* Helpers for curriculum */
function getCurrentModule() {
  return curriculum[localState.moduleIndex] || curriculum[0];
}
function getCurrentSection() {
  const m = getCurrentModule();
  return (m && m.sections[localState.sectionIndex]) || (m && m.sections[0]);
}
function getCurrentLessonObj() {
  const s = getCurrentSection();
  return (s && s.lessons[localState.lessonIndex]) || { title: "Lesson", content: "", xp: 0 };
}
function getCurrentLessonText() {
  const m = getCurrentModule();
  const s = getCurrentSection();
  const l = getCurrentLessonObj();
  return `${m.title} • ${s.title} • ${l.title}`;
}

/* Update UI lesson display and persist current_lesson string */
function setCurrentLessonUI() {
  localState.current_lesson = getCurrentLessonText();
  applyStateToUI();
  showLessonContent();
}

/* Advance progression: returns true if advanced, false if at end */
function advanceProgression() {
  const mCount = curriculum.length;
  const m = curriculum[localState.moduleIndex];
  if (!m) return false;
  const sCount = m.sections.length;
  const s = m.sections[localState.sectionIndex];
  if (!s) return false;
  const lCount = s.lessons.length;

  // Advance lesson index
  if (localState.lessonIndex + 1 < lCount) {
    localState.lessonIndex += 1;
    return true;
  }

  // Move to next section
  if (localState.sectionIndex + 1 < sCount) {
    localState.sectionIndex += 1;
    localState.lessonIndex = 0;
    return true;
  }

  // Move to next module
  if (localState.moduleIndex + 1 < mCount) {
    localState.moduleIndex += 1;
    localState.sectionIndex = 0;
    localState.lessonIndex = 0;
    return true;
  }

  // End of curriculum
  return false;
}

/* Jump to a specific module/section/lesson (safe bounds) */
function goToProgress(moduleIdx = 0, sectionIdx = 0, lessonIdx = 0) {
  localState.moduleIndex = Math.max(0, Math.min(moduleIdx, curriculum.length - 1));
  const m = curriculum[localState.moduleIndex];
  localState.sectionIndex = Math.max(0, Math.min(sectionIdx, m.sections.length - 1));
  const s = m.sections[localState.sectionIndex];
  localState.lessonIndex = Math.max(0, Math.min(lessonIdx, s.lessons.length - 1));
  setCurrentLessonUI();
  saveState();
}

/* Show lesson content in UI (if element exists) */
function showLessonContent() {
  const contentEl = document.getElementById("lesson-content");
  const lessonObj = getCurrentLessonObj();
  if (!contentEl) return;
  contentEl.innerText = lessonObj.content || "No content available for this lesson.";
  const titleEl = document.getElementById("lesson-title");
  if (titleEl) titleEl.innerText = lessonObj.title || "Lesson";
  const xpEl = document.getElementById("lesson-xp");
  if (xpEl) xpEl.innerText = `XP: ${lessonObj.xp || 0}`;
}

/* ---------------------------
   State load/save
   --------------------------- */

async function loadState() {
  try {
    const res = await fetch(`${API}/state`);
    if (!res.ok) throw new Error("Backend state fetch failed");
    const data = await res.json();
    localState = { ...localState, ...data };
    // Ensure progression indices exist
    if (typeof localState.moduleIndex === "undefined") localState.moduleIndex = 0;
    if (typeof localState.sectionIndex === "undefined") localState.sectionIndex = 0;
    if (typeof localState.lessonIndex === "undefined") localState.lessonIndex = 0;
    if (typeof localState.xp === "undefined") localState.xp = 0;
    loadedFromBackend = true;
    applyStateToUI();
    console.log("State loaded from backend:", localState);
    return localState;
  } catch (err) {
    console.warn("Backend state unavailable, falling back to localStorage:", err);
    const raw = localStorage.getItem("mammoth_state");
    if (raw) {
      try {
        localState = { ...localState, ...JSON.parse(raw) };
        if (typeof localState.moduleIndex === "undefined") localState.moduleIndex = 0;
        if (typeof localState.sectionIndex === "undefined") localState.sectionIndex = 0;
        if (typeof localState.lessonIndex === "undefined") localState.lessonIndex = 0;
        if (typeof localState.xp === "undefined") localState.xp = 0;
        loadedFromBackend = false;
        applyStateToUI();
        console.log("State loaded from localStorage:", localState);
        return localState;
      } catch (e) {
        console.error("Failed to parse local state:", e);
      }
    }
    applyStateToUI();
    return localState;
  }
}

async function saveState() {
  // Persist to localStorage immediately
  localStorage.setItem("mammoth_state", JSON.stringify(localState));
  lastSavedAt = new Date().toLocaleTimeString();
  updateStateIndicators();
  // Try to persist to backend
  try {
    const res = await fetch(`${API}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localState)
    });
    if (!res.ok) throw new Error("Backend state save failed");
    const json = await res.json();
    loadedFromBackend = true;
    lastSavedAt = new Date().toLocaleTimeString();
    updateStateIndicators();
    console.log("State saved to backend:", json);
    return json;
  } catch (err) {
    console.warn("Failed to save state to backend, kept in localStorage:", err);
    loadedFromBackend = false;
    updateStateIndicators();
    return null;
  }
}

function applyStateToUI() {
  const { revenue, orders, current_lesson, streak, xp } = localState;
  const revEl = document.getElementById("revenue");
  const ordEl = document.getElementById("orders");
  const lessonEl = document.getElementById("lesson");
  const streakEl = document.getElementById("streak");
  const xpEl = document.getElementById("xp");
  if (revEl) revEl.innerText = revenue;
  if (ordEl) ordEl.innerText = orders;
  if (lessonEl) lessonEl.innerText = current_lesson;
  if (streakEl) streakEl.innerText = streak;
  if (xpEl) xpEl.innerText = xp;
  updateStateIndicators();
}

function updateStateIndicators() {
  const srcEl = document.getElementById("state-source");
  const savedEl = document.getElementById("state-last-saved");
  if (srcEl) srcEl.innerText = loadedFromBackend ? "Backend" : "Local";
  if (savedEl) savedEl.innerText = lastSavedAt ? `Last saved: ${lastSavedAt}` : "";
}

/* ---------------------------
   UI / Utility functions
   --------------------------- */

/* PANEL SWITCHING */
function switchPanel(panel) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(panel);
  if (el) el.classList.add("active");
}

/* TERMINAL LOGGING */
function logToTerminal(message) {
  const term = document.getElementById("terminal-output");
  if (!term) return;
  const line = document.createElement("div");
  line.textContent = "> " + message;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

/* NOTIFICATIONS */
function notify(msg) {
  const box = document.getElementById("notifications");
  if (!box) return;
  const note = document.createElement("div");
  note.className = "notification";
  note.textContent = msg;
  box.appendChild(note);
  setTimeout(() => note.remove(), 4000);
}

/* AUTONOMY MODE */
let autonomyMode = "semi";

function changeAutonomyMode() {
  const sel = document.getElementById("autonomy-select");
  autonomyMode = sel ? sel.value : "semi";
  notify(`⚙️ Autonomy Mode: ${autonomyMode === "semi" ? "Semi-Autonomous" : "Full Autonomous"}`);
  logToTerminal(`Krampus: Autonomy mode switched to ${autonomyMode}.`);
}

/* UI SHORTCUT */
function openMammothUI() {
  switchPanel("dashboard");
  notify("🦣 Mammoth OS UI opened.");
}

/* GLOBAL HOTKEY */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "m") {
    openMammothUI();
  }
});

/* THEME SWITCHER */
function changeTheme() {
  const themeEl = document.getElementById("theme-select");
  const theme = themeEl ? themeEl.value : "default";
  document.body.classList.remove("night", "holo");

  if (theme === "night") {
    document.body.classList.add("night");
    notify("🌑 Night Mode Activated");
  } else if (theme === "holo") {
    document.body.classList.add("holo");
    notify("🧬 Holographic Mode Activated");
  } else {
    notify("🌕 Default Mode Activated");
  }
}

/* PULSE MODE */
let pulseEnabled = false;

function togglePulse() {
  pulseEnabled = !pulseEnabled;
  if (pulseEnabled) {
    document.body.classList.add("pulse");
    notify("💓 Pulse Mode Enabled");
  } else {
    document.body.classList.remove("pulse");
    notify("💤 Pulse Mode Disabled");
  }
}

/* KRAMPUS SARCASM */
let sarcasmLevel = 1; // 0 = soft, 1 = normal, 2 = spicy

function changeSarcasm() {
  const el = document.getElementById("sarcasm-range");
  sarcasmLevel = el ? parseInt(el.value, 10) : 1;
  notify(`😈 Krampus Sarcasm Level: ${sarcasmLevel}`);
}

const krampusLinesBase = {
  seed: [
    "Planting seeds like a forest witch.",
    "Another seed? You’re becoming dangerous.",
    "Growth begins with intention."
  ],
  lesson: [
    "Advancing your lesson. Stay sharp.",
    "Knowledge is a blade. Keep it honed.",
    "Next lesson loaded. Don’t slack."
  ],
  system: [
    "System stable.",
    "Monitoring agents… they’re behaving.",
    "Cortex link strong."
  ]
};

const krampusLinesSpicy = {
  seed: [
    "Another seed? You hoarder of growth.",
    "You’re planting more than a forest at this point.",
    "Fine. More seeds. Don’t waste them."
  ],
  lesson: [
    "Next lesson. Try not to forget this one.",
    "You sure you’re ready for this?",
    "Lesson advanced. No excuses now."
  ],
  system: [
    "System stable—for now.",
    "Agents behaving… suspiciously well.",
    "Cortex link strong. Unlike your sleep schedule."
  ]
};

function krampusSpeak(type) {
  let lines;
  if (sarcasmLevel === 2) {
    lines = krampusLinesSpicy[type];
  } else {
    lines = krampusLinesBase[type];
  }
  const line = lines[Math.floor(Math.random() * lines.length)];
  logToTerminal(`Krampus: ${line}`);
}

/* ---------------------------
   Intent / Action functions
   --------------------------- */

async function plantSeed() {
  try {
    await fetch(`${API}/run-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "plant_seed",
        payload: { topic: "AI Engineering" }
      })
    });
  } catch (e) {
    logToTerminal("Krampus: plantSeed intent failed (backend).");
  }

  // Update local state
  localState.orders = (localState.orders || 0) + 1;
  localState.revenue = (localState.revenue || 0) + 5;
  // small XP reward for planting
  localState.xp = (localState.xp || 0) + 3;

  await saveState();
  applyStateToUI();

  krampusSpeak("seed");
  logToTerminal("Krampus: Seed planted.");
  notify("🌱 Seed planted! +3 XP");
  rememberAgentEvent("curriculum", "Seed planted for AI Engineering.");
}

/* nextLesson uses Lesson Progression Engine */
async function nextLesson() {
  try {
    await fetch(`${API}/run-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "next_lesson" })
    });
  } catch (e) {
    logToTerminal("Krampus: nextLesson intent failed (backend).");
  }

  const advanced = advanceProgression();
  if (!advanced) {
    notify("🏁 You reached the end of the curriculum. Great work!");
    logToTerminal("Krampus: Curriculum complete.");
    return;
  }

  // Award XP for completing previous lesson
  const completedLesson = getCurrentLessonObj();
  localState.xp = (localState.xp || 0) + (completedLesson.xp || 0);

  setCurrentLessonUI();
  localState.streak = (localState.streak || 0) + 1;
  await saveState();

  krampusSpeak("lesson");
  logToTerminal("Krampus: Lesson advanced.");
  notify(`📘 Advanced to ${localState.current_lesson} (+${completedLesson.xp || 0} XP)`);
  rememberAgentEvent("curriculum", `Lesson advanced to ${localState.current_lesson}`);
}

async function loadLeaderboard() {
  try {
    await fetch(`${API}/run-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "leaderboard" })
    });
  } catch (e) {
    logToTerminal("Krampus: loadLeaderboard intent failed (backend).");
  }

  krampusSpeak("system");
  logToTerminal("Krampus: Leaderboard loaded.");
  notify("🏆 Leaderboard updated!");
  rememberAgentEvent("market", "Leaderboard checked.");
}

/* METRICS */
async function updateMetrics() {
  try {
    const res = await fetch(`${API}/metrics`);
    if (!res.ok) throw new Error("metrics fetch failed");
    const data = await res.json();

    // Prefer backend metrics but fall back to localState
    localState.revenue = data.revenue ?? localState.revenue;
    localState.orders = data.orders ?? localState.orders;
    // backend uses "lessons" key for current lesson string
    localState.current_lesson = data.lessons ?? localState.current_lesson;
    localState.streak = data.streak ?? localState.streak;

    applyStateToUI();
  } catch (e) {
    logToTerminal("Krampus: Metrics fetch failed; using local state.");
    applyStateToUI();
  }
}

/* ---------------------------
   Skill tree, agents, UI extras
   --------------------------- */

const skillDescriptions = {
  ai: "AI Engineering: Neural networks, agents, Mammoth OS internals.",
  survival: "Survival: Fieldcraft, firecraft, shelter, rugged knowledge.",
  plants: "Plant Identification: Medicinal plants, edible species.",
  business: "Business: True XXII Supply, revenue systems.",
  fieldcraft: "Fieldcraft: Navigation, tracking, wilderness movement."
};

let selectedSkill = null;
let unlockedSkills = new Set();

document.querySelectorAll(".skill-node").forEach(node => {
  node.addEventListener("click", () => {
    selectedSkill = node.dataset.skill;
    const desc = document.getElementById("skill-description");
    if (desc) desc.innerText = skillDescriptions[selectedSkill];
  });
});

function unlockSkill() {
  if (!selectedSkill) return;

  unlockedSkills.add(selectedSkill);

  const node = document.querySelector(`.skill-node[data-skill="${selectedSkill}"]`);
  if (node) node.classList.add("unlocked");

  notify(`🔥 Skill unlocked: ${skillDescriptions[selectedSkill]}`);
  logToTerminal(`Krampus: Skill unlocked → ${selectedSkill}`);
  rememberAgentEvent("reflection", `Skill unlocked: ${selectedSkill}`);
}

/* NEURAL LINKS, AGENTS, EMOTIONS, TASKS (unchanged) */
function neuralLinks() {
  const canvas = document.getElementById("neural-links");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const nodes = [
    { x: 80, y: 80 },
    { x: 200, y: 40 },
    { x: 320, y: 100 },
    { x: 450, y: 60 },
    { x: 600, y: 120 }
  ];

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgba(127, 255, 127, ${0.3 + 0.2 * Math.sin(t)})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < nodes.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      ctx.stroke();
    }

    t += 0.05;
    requestAnimationFrame(draw);
  }

  draw();
}

function updateAgent(agent, status, task) {
  const card = document.querySelector(`.agent-card[data-agent="${agent}"]`);
  if (!card) return;
  const statusEl = card.querySelector(".agent-status");
  const taskEl = card.querySelector(".agent-task");
  const lastEl = card.querySelector(".agent-last");
  if (statusEl) statusEl.innerText = status;
  if (taskEl) taskEl.innerText = task;
  if (lastEl) lastEl.innerText = task;
}

function agentMessage(agent, msg) {
  const board = document.getElementById("agent-messages");
  if (!board) return;
  const line = document.createElement("div");
  line.textContent = `${agent}: ${msg}`;
  board.appendChild(line);
  board.scrollTop = board.scrollHeight;
}

let taskQueue = [];
function addTask(agent, task) {
  taskQueue.push({ agent, task });
  const queue = document.getElementById("task-queue");
  if (!queue) return;
  const line = document.createElement("div");
  line.textContent = `${agent}: ${task}`;
  queue.appendChild(line);
  queue.scrollTop = queue.scrollHeight;
}

function agentRequest(agent, msg) {
  const feed = document.getElementById("agent-requests");
  if (!feed) return;
  const line = document.createElement("div");
  line.textContent = `${agent}: ${msg}`;
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
}

function rememberAgentEvent(agent, msg) {
  const memory = document.getElementById("agent-memory");
  if (!memory) return;
  const line = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();
  line.textContent = `[${timestamp}] ${agent}: ${msg}`;
  memory.appendChild(line);
  memory.scrollTop = memory.scrollHeight;
}

function simulateTaskEngine() {
  if (autonomyMode !== "full") return;

  const tasks = [
    "Analyzing curriculum gaps",
    "Refactoring module structure",
    "Scanning market trends",
    "Optimizing brand tone",
    "Evaluating agent performance"
  ];

  const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

  updateAgent("taskengine", "Running", randomTask);
  addTask("AutonomousTaskEngine", randomTask);
  agentMessage("AutonomousTaskEngine", `Completed: ${randomTask}`);
  rememberAgentEvent("taskengine", `Completed: ${randomTask}`);

  setTimeout(() => {
    updateAgent("taskengine", "Idle", randomTask);
  }, 3000);
}

function cascadingTasks() {
  if (autonomyMode !== "full") return;

  const chain = [
    { agent: "market", task: "Scanning market trends..." },
    { agent: "curriculum", task: "Adjusting lesson difficulty..." },
    { agent: "coding", task: "Refactoring module code..." },
    { agent: "reflection", task: "Analyzing output quality..." },
    { agent: "brand", task: "Updating brand tone..." }
  ];

  let step = 0;

  function runStep() {
    const { agent, task } = chain[step];

    updateAgent(agent, "Running", task);
    addTask(agent, task);
    agentMessage(agent, `Completed: ${task}`);
    rememberAgentEvent(agent, `Completed: ${task}`);

    setTimeout(() => {
      updateAgent(agent, "Idle", task);
      step++;
      if (step < chain.length) runStep();
    }, 2500);
  }

  runStep();
}

/* Agent personalities & emotions */
const agentPersonalities = {
  coding: ["Precise", "Logical", "Efficient"],
  curriculum: ["Creative", "Structured", "Warm"],
  reflection: ["Minimalist", "Observant", "Neutral"],
  brand: ["Expressive", "Stylish", "Bold"],
  market: ["Calm", "Analytical", "Strategic"],
  taskengine: ["Orchestrator", "Planner", "Autonomous"]
};

function randomPersonality(agent) {
  const traits = agentPersonalities[agent];
  return traits[Math.floor(Math.random() * traits.length)];
}

function updatePersonality(agent) {
  const card = document.querySelector(`.agent-card[data-agent="${agent}"]`);
  if (!card) return;
  const trait = randomPersonality(agent);
  const p = card.querySelector("p:nth-child(5)");
  if (p) p.innerText = `Personality: ${trait}`;
}

const agentEmotions = ["Calm", "Focused", "Overloaded", "Curious", "Frustrated"];

function updateEmotion(agent) {
  const card = document.querySelector(`.agent-card[data-agent="${agent}"]`);
  if (!card) return;

  const emotion = agentEmotions[Math.floor(Math.random() * agentEmotions.length)];
  const emotionEl = card.querySelector(".agent-emotion");
  if (emotionEl) emotionEl.innerText = `Emotion: ${emotion}`;

  const avatar = card.querySelector(".agent-avatar");
  if (!avatar) return;

  if (emotion === "Calm") avatar.style.filter = "brightness(1)";
  if (emotion === "Focused") avatar.style.filter = "brightness(1.2)";
  if (emotion === "Overloaded") avatar.style.filter = "brightness(0.8) saturate(1.4)";
  if (emotion === "Curious") avatar.style.filter = "hue-rotate(40deg)";
  if (emotion === "Frustrated") avatar.style.filter = "hue-rotate(-40deg)";

  agentMessage(agent, `Emotion shift detected → ${emotion}`);
}

/* TERMINAL THEMES & COMMANDS */
function changeTerminalTheme() {
  const theme = document.getElementById("terminal-theme").value;
  const terminal = document.querySelector(".terminal");
  if (!terminal) return;

  terminal.classList.remove("green", "blue", "orange", "white");
  terminal.classList.add(theme);

  notify(`💻 Terminal Theme: ${theme}`);
}

const commands = {
  help: () => {
    logToTerminal("Commands: help, seed, lesson, skills, unlock <skill>, clear, goto <m> <s> <l>");
  },
  clear: () => {
    const out = document.getElementById("terminal-output");
    if (out) out.innerHTML = "";
  },
  seed: () => plantSeed(),
  lesson: () => nextLesson(),
  skills: () => {
    logToTerminal("Unlocked skills: " + [...unlockedSkills].join(", "));
  },
  unlock: (skill) => {
    selectedSkill = skill;
    unlockSkill();
  },
  goto: (m, s, l) => {
    const mi = parseInt(m, 10) || 0;
    const si = parseInt(s, 10) || 0;
    const li = parseInt(l, 10) || 0;
    goToProgress(mi, si, li);
    logToTerminal(`Jumped to ${localState.current_lesson}`);
  }
};

function runCommand() {
  const input = document.getElementById("command-input");
  if (!input) return;
  const raw = input.value.trim();
  input.value = "";

  if (!raw) return;

  const parts = raw.split(" ");
  const base = parts[0];
  const args = parts.slice(1);

  if (commands[base]) {
    commands[base](...args);
  } else {
    logToTerminal("Krampus: Unknown command.");
  }
}

/* HEARTBEAT */
setInterval(() => {
  const hb = document.getElementById("status-heartbeat");
  if (!hb) return;
  hb.style.opacity = hb.style.opacity === "0.4" ? "1" : "0.4";
}, 800);

/* INTERVALS */
setInterval(updateMetrics, 3000);
setInterval(simulateTaskEngine, 5000);
setInterval(cascadingTasks, 20000);
setInterval(() => {
  ["coding","curriculum","reflection","brand","market","taskengine"]
    .forEach(updatePersonality);
}, 7000);

setInterval(() => {
  const suggestions = [
    "Recommend reviewing lesson structure.",
    "Suggest optimizing file hierarchy.",
    "Request permission to refactor module.",
    "Recommend updating brand tone.",
    "Request deeper market scan."
  ];

  const agents = ["coding","curriculum","reflection","brand","market","taskengine"];
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const msg = suggestions[Math.floor(Math.random() * suggestions.length)];

  agentRequest(agent, msg);
}, 9000);

setInterval(() => {
  ["coding","curriculum","reflection","brand","market","taskengine"]
    .forEach(updateEmotion);
}, 10000);

/* Safe boot chime handling and DOM-ready initialization */
function tryPlayChimeOnGesture(chime) {
  if (!chime) return;
  function tryPlay() {
    chime.volume = 0.4;
    chime.play().catch(() => {});
    window.removeEventListener("pointerdown", tryPlay);
    window.removeEventListener("keydown", tryPlay);
  }
  chime.play().catch(() => {
    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });
  });
}

/* Complete button wiring (safe to run multiple times) */
function wireCompleteButton() {
  const completeBtn = document.getElementById("complete-lesson-btn");
  if (!completeBtn) return;
  // Remove existing listener if present to avoid duplicates
  completeBtn.replaceWith(completeBtn.cloneNode(true));
  const newBtn = document.getElementById("complete-lesson-btn");
  if (!newBtn) return;
  newBtn.addEventListener("click", async () => {
    try {
      const lessonObj = getCurrentLessonObj();
      localState.xp = (localState.xp || 0) + (lessonObj.xp || 0);

      const advanced = advanceProgression();
      if (!advanced) {
        notify("🏁 You reached the end of the curriculum. Great work!");
        logToTerminal("Krampus: Curriculum complete.");
        await saveState();
        return;
      }

      setCurrentLessonUI();
      localState.streak = (localState.streak || 0) + 1;
      await saveState();

      notify(`📘 Advanced to ${localState.current_lesson} (+${lessonObj.xp || 0} XP)`);
      logToTerminal(`Krampus: Completed lesson and advanced → ${localState.current_lesson}`);

      // Post granular progress to backend if endpoint exists (safe to ignore errors)
      try {
        await fetch(`${API}/state/lesson`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleIndex: localState.moduleIndex,
            sectionIndex: localState.sectionIndex,
            lessonIndex: localState.lessonIndex
          })
        });
      } catch (e) {
        // ignore if endpoint not present
      }
    } catch (e) {
      console.error("Complete handler failed", e);
      logToTerminal("Krampus: Error completing lesson.");
    }
  });
}

/* Boot sequence */
setTimeout(async () => {
  document.querySelector(".layout").classList.remove("hidden");
  neuralLinks();
  await loadState(); // load persisted state on boot

  // Ensure DOM is ready before updating lesson UI and wiring button
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setCurrentLessonUI();
      showLessonContent();
      wireCompleteButton();
      const chime = document.getElementById("boot-chime");
      tryPlayChimeOnGesture(chime);
    });
  } else {
    setCurrentLessonUI();
    showLessonContent();
    wireCompleteButton();
    const chime = document.getElementById("boot-chime");
    tryPlayChimeOnGesture(chime);
  }
}, 3200);

/* Small immediate boot helpers */
setTimeout(updateMetrics, 1000);

setTimeout(() => {
  const chime = document.getElementById("boot-chime");
  tryPlayChimeOnGesture(chime);
}, 500);

/* TERMINAL COMMANDS wiring (input handler) */
function runCommandFromInput() {
  const input = document.getElementById("command-input");
  if (!input) return;
  const raw = input.value.trim();
  input.value = "";
  if (!raw) return;
  const parts = raw.split(" ");
  const base = parts[0];
  const args = parts.slice(1);
  if (commands[base]) {
    commands[base](...args);
  } else {
    logToTerminal("Krampus: Unknown command.");
  }
}

/* Expose some helpers to console for quick debugging */
window.goToProgress = goToProgress;
window.setCurrentLessonUI = setCurrentLessonUI;
window.showLessonContent = showLessonContent;
window.wireCompleteButton = wireCompleteButton;
window.getCurrentLessonObj = getCurrentLessonObj;
