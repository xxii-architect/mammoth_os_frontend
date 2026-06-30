const API = "http://127.0.0.1:8000";

/* PANEL SWITCHING */
function switchPanel(panel) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById(panel).classList.add("active");
}

/* TERMINAL LOGGING */
function logToTerminal(message) {
    const term = document.getElementById("terminal-output");
    const line = document.createElement("div");
    line.textContent = "> " + message;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

/* NOTIFICATIONS */
function notify(msg) {
    const box = document.getElementById("notifications");
    const note = document.createElement("div");
    note.className = "notification";
    note.textContent = msg;
    box.appendChild(note);
    setTimeout(() => note.remove(), 4000);
}

/* AUTONOMY MODE */
let autonomyMode = "semi";

function changeAutonomyMode() {
    autonomyMode = document.getElementById("autonomy-select").value;
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
    const theme = document.getElementById("theme-select").value;
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
    sarcasmLevel = parseInt(document.getElementById("sarcasm-range").value, 10);
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

/* INTENT FUNCTIONS */
async function plantSeed() {
    await fetch(`${API}/run-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            intent: "plant_seed",
            payload: { topic: "AI Engineering" }
        })
    });

    krampusSpeak("seed");
    logToTerminal("Krampus: Seed planted.");
    notify("🌱 Seed planted!");
    rememberAgentEvent("curriculum", "Seed planted for AI Engineering.");
}

async function nextLesson() {
    await fetch(`${API}/run-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "next_lesson" })
    });

    krampusSpeak("lesson");
    logToTerminal("Krampus: Lesson advanced.");
    notify("📘 Advanced to next lesson!");
    rememberAgentEvent("curriculum", "Lesson advanced.");
}

async function loadLeaderboard() {
    await fetch(`${API}/run-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "leaderboard" })
    });

    krampusSpeak("system");
    logToTerminal("Krampus: Leaderboard loaded.");
    notify("🏆 Leaderboard updated!");
    rememberAgentEvent("market", "Leaderboard checked.");
}

/* METRICS */
async function updateMetrics() {
    try {
        const res = await fetch(`${API}/metrics`);
        const data = await res.json();

        document.getElementById("revenue").innerText = data.revenue;
        document.getElementById("orders").innerText = data.orders;
        document.getElementById("lesson").innerText = data.lessons;
        document.getElementById("streak").innerText = data.streak;
    } catch (e) {
        logToTerminal("Krampus: Metrics fetch failed.");
    }
}

/* SKILL TREE ENGINE */
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
        document.getElementById("skill-description").innerText =
            skillDescriptions[selectedSkill];
    });
});

function unlockSkill() {
    if (!selectedSkill) return;

    unlockedSkills.add(selectedSkill);

    document.querySelector(`.skill-node[data-skill="${selectedSkill}"]`)
        .classList.add("unlocked");

    notify(`🔥 Skill unlocked: ${skillDescriptions[selectedSkill]}`);
    logToTerminal(`Krampus: Skill unlocked → ${selectedSkill}`);
    rememberAgentEvent("reflection", `Skill unlocked: ${selectedSkill}`);
}

/* NEURAL LINK ANIMATION */
function neuralLinks() {
    const canvas = document.getElementById("neural-links");
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

/* AGENT DASHBOARD HELPERS */
function updateAgent(agent, status, task) {
    const card = document.querySelector(`.agent-card[data-agent="${agent}"]`);
    if (!card) return;
    card.querySelector(".agent-status").innerText = status;
    card.querySelector(".agent-task").innerText = task;
    card.querySelector(".agent-last").innerText = task;
}

function agentMessage(agent, msg) {
    const board = document.getElementById("agent-messages");
    const line = document.createElement("div");
    line.textContent = `${agent}: ${msg}`;
    board.appendChild(line);
    board.scrollTop = board.scrollHeight;
}

/* TASK QUEUE */
let taskQueue = [];

function addTask(agent, task) {
    taskQueue.push({ agent, task });

    const queue = document.getElementById("task-queue");
    const line = document.createElement("div");
    line.textContent = `${agent}: ${task}`;
    queue.appendChild(line);
    queue.scrollTop = queue.scrollHeight;
}

/* AGENT REQUESTS & SUGGESTIONS */
function agentRequest(agent, msg) {
    const feed = document.getElementById("agent-requests");
    const line = document.createElement("div");
    line.textContent = `${agent}: ${msg}`;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
}

/* AGENT MEMORY */
function rememberAgentEvent(agent, msg) {
    const memory = document.getElementById("agent-memory");
    const line = document.createElement("div");
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${agent}: ${msg}`;
    memory.appendChild(line);
    memory.scrollTop = memory.scrollHeight;
}

/* AUTONOMOUS TASKENGINE SIMULATION */
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

/* AUTONOMOUS CASCADING TASKS */
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

/* AGENT PERSONALITIES */
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
    card.querySelector("p:nth-child(5)").innerText = `Personality: ${trait}`;
}

/* AGENT EMOTION SYSTEM */
const agentEmotions = ["Calm", "Focused", "Overloaded", "Curious", "Frustrated"];

function updateEmotion(agent) {
    const card = document.querySelector(`.agent-card[data-agent="${agent}"]`);
    if (!card) return;

    const emotion = agentEmotions[Math.floor(Math.random() * agentEmotions.length)];
    card.querySelector(".agent-emotion").innerText = `Emotion: ${emotion}`;

    // Emotion-based color shifts
    const avatar = card.querySelector(".agent-avatar");
    if (!avatar) return;

    if (emotion === "Calm") avatar.style.filter = "brightness(1)";
    if (emotion === "Focused") avatar.style.filter = "brightness(1.2)";
    if (emotion === "Overloaded") avatar.style.filter = "brightness(0.8) saturate(1.4)";
    if (emotion === "Curious") avatar.style.filter = "hue-rotate(40deg)";
    if (emotion === "Frustrated") avatar.style.filter = "hue-rotate(-40deg)";

    agentMessage(agent, `Emotion shift detected → ${emotion}`);
}

/* TERMINAL THEMES */
function changeTerminalTheme() {
    const theme = document.getElementById("terminal-theme").value;
    const terminal = document.querySelector(".terminal");

    terminal.classList.remove("green", "blue", "orange", "white");
    terminal.classList.add(theme);

    notify(`💻 Terminal Theme: ${theme}`);
}

/* TERMINAL COMMANDS */
const commands = {
    help: () => {
        logToTerminal("Commands: help, seed, lesson, skills, unlock <skill>, clear");
    },
    clear: () => {
        document.getElementById("terminal-output").innerHTML = "";
    },
    seed: () => plantSeed(),
    lesson: () => nextLesson(),
    skills: () => {
        logToTerminal("Unlocked skills: " + [...unlockedSkills].join(", "));
    },
    unlock: (skill) => {
        selectedSkill = skill;
        unlockSkill();
    }
};

function runCommand() {
    const input = document.getElementById("command-input");
    const cmd = input.value.trim();
    input.value = "";

    if (!cmd) return;

    const parts = cmd.split(" ");
    const base = parts[0];
    const arg = parts[1];

    if (commands[base]) {
        commands[base](arg);
    } else {
        logToTerminal("Krampus: Unknown command.");
    }
}

/* HEARTBEAT */
setInterval(() => {
    const hb = document.getElementById("status-heartbeat");
    hb.style.opacity = hb.style.opacity === "0.4" ? "1" : "0.4";
}, 800);

/* INTERVALS & BOOT SEQUENCE */
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

setTimeout(updateMetrics, 1000);

setTimeout(() => {
    const chime = document.getElementById("boot-chime");
    if (chime) {
        chime.volume = 0.4;
        chime.play();
    }
}, 500);

setTimeout(() => {
    document.querySelector(".layout").classList.remove("hidden");
    neuralLinks();
}, 3200);
