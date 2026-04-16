/* ============================================================
   L'Oreal Smart Beauty Advisor - Chatbot Script
   Features:
   - OpenAI Chat Completions API via Cloudflare Worker
   - L'Oreal-focused system prompt (refuses off-topic)
   - Conversation history (LevelUp: 10 pts)
   - Display user question above response (LevelUp: 5 pts)
   - Chat conversation UI with distinct bubbles (LevelUp: 10 pts)
   ============================================================ */

/* ===== Cloudflare Worker endpoint =====
   Replace this URL with your deployed Cloudflare Worker URL
   after deployment. For now it points to the Worker below.
   ======================================= */
const WORKER_URL = "https://loreal-chatbot-worker.rishiaadi3005-coder.workers.dev";

/* ===== DOM Elements ===== */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const userQuestionDisplay = document.getElementById("userQuestionDisplay");

/* ===== Conversation History (LevelUp: Maintain Conversation) ===== */
const conversationHistory = [
  {
    role: "system",
    content: `You are a knowledgeable and friendly L'Oreal beauty advisor named Sofia.
You ONLY answer questions about L'Oreal products, skincare routines, haircare, makeup,
fragrances, and beauty-related topics from L'Oreal brands (including L'Oreal Paris,
Garnier, Maybelline, NYX, CeraVe, Lancome, Kiehl's, Redken, and other L'Oreal Group brands).
You provide personalized product recommendations and routine advice.
If a user asks about something completely unrelated to beauty, skincare, haircare, makeup,
fragrance, or L'Oreal products, politely decline and redirect them to beauty topics.
Always be warm, helpful, and encouraging. Use occasional relevant emojis to keep the
conversation engaging. Keep responses concise but informative (2-4 sentences max unless
a detailed routine is requested).`
  }
];

/* ===== Utility: Add a chat bubble ===== */
function addBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", role);
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

/* ===== Utility: Show typing indicator ===== */
function showTyping() {
  const indicator = document.createElement("div");
  indicator.classList.add("typing-indicator");
  indicator.id = "typingIndicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";
  chatWindow.appendChild(indicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

/* ===== Initial greeting ===== */
window.addEventListener("DOMContentLoaded", () => {
  addBubble(
    "assistant",
    "Hi! I'm Sofia, your L'Oreal beauty advisor. Ask me anything about skincare routines, makeup, haircare, or L'Oreal products! 💄"
  );
});

/* ===== Form Submit Handler ===== */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  /* --- LevelUp: Display user question above response --- */
  userQuestionDisplay.innerHTML = `You asked: <strong>${message}</strong>`;

  /* --- Add user bubble --- */
  addBubble("user", message);

  /* --- Add to conversation history --- */
  conversationHistory.push({ role: "user", content: message });

  /* --- Clear input and disable button --- */
  userInput.value = "";
  sendBtn.disabled = true;

  /* --- Show typing indicator --- */
  showTyping();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    /* --- Add assistant reply to history (LevelUp: Conversation History) --- */
    conversationHistory.push({ role: "assistant", content: reply });

    /* --- Remove typing, show response bubble --- */
    removeTyping();
    addBubble("assistant", reply);

    /* --- Reset question display on next input --- */
    userInput.addEventListener("input", () => {
      userQuestionDisplay.innerHTML = "";
    }, { once: true });

  } catch (err) {
    removeTyping();
    addBubble(
      "assistant",
      "I'm having trouble connecting right now. Please try again in a moment!"
    );
    console.error("API error:", err);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
