// Minimal chat with on-device Prompt API (Gemini Nano)
// NOTE: keep options IDENTICAL in availability() and create()
const options = {}; // add expectedInputs later if you go multimodal

const messagesEl = document.getElementById("messages");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const btnSend = document.getElementById("send");
const btnStop = document.getElementById("stop");

let session;
let controller; // for stopping streaming
let history = (await chrome.storage.local.get("chatHistory")).chatHistory || [];

// init: show history and prepare session
renderHistory(history);
await ensureSession();

// submit handling
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";
  await replyTo(text);
  saveHistory();
});

// enter to send; shift+enter for newline
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

btnStop.onclick = () => controller?.abort();

// core helpers
async function ensureSession() {
  const a = await LanguageModel.availability(options);
  if (a === "unavailable") throw new Error("Prompt API unavailable.");
  session = await LanguageModel.create({
    ...options,
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        showPlaceholder(`Downloading model… ${Math.round(e.loaded * 100)}%`);
      });
    }
  });
  clearPlaceholder();
}

// simple “assistant” response with streaming
async function replyTo(userText) {
  // seed prompt with a short system style (optional)
  const prompt = [
    "You are a concise, friendly assistant.",
    "Format lists as short bullets. Keep answers tight.",
    "",
    `User: ${userText}`,
  ].join("\n");

  // UI: create an empty bot bubble and stream into it
  const botEl = appendMessage("bot", "");
  botEl.classList.add("streaming");

  try {
    controller = new AbortController();
    const stream = await session.promptStreaming(prompt, { signal: controller.signal });
    for await (const chunk of stream) {
      botEl.textContent += chunk;
      // auto-scroll
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      botEl.textContent += `\n\n[error: ${err.message || err}]`;
    }
  } finally {
    controller = undefined;
    botEl.classList.remove("streaming");
  }
}

function appendMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // push into local history (cap length)
  history.push({ role, text });
  if (history.length > 100) history = history.slice(-100);
  return bubble;
}

function renderHistory(list) {
  messagesEl.innerHTML = "";
  if (!list.length) {
    showPlaceholder("Start chatting with the on-device model!");
    return;
  }
  for (const m of list) appendMessage(m.role, m.text);
}

function showPlaceholder(text) {
  const ph = document.createElement("div");
  ph.className = "placeholder";
  ph.textContent = text;
  ph.id = "ph";
  messagesEl.appendChild(ph);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function clearPlaceholder() {
  const ph = document.getElementById("ph");
  if (ph) ph.remove();
}

async function saveHistory() {
  await chrome.storage.local.set({ chatHistory: history });
}
