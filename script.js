/*
GAR2.ai — Frontend-only chat for GitHub Pages using user-supplied Groq key.
Demo mode uses canned responses and does NOT call Groq.
*/

let API_KEY = null;
let DEMO_MODE = false;

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

const popup = document.getElementById("key-popup");
const keyInput = document.getElementById("key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const useDemoBtn = document.getElementById("use-demo-btn");

// Safe system prompt for the assistant
const SYSTEM_PROMPT = "You are Goofy AI Realm 2nd, a silly but helpful and safe AI assistant. Avoid providing instructions for illegal or dangerous activities, do not create sexually explicit content, and do not encourage self-harm. Keep responses friendly and kid-safe.";

// Simple helper to create message elements
function addMessage(sender, text) {
  const wrapper = document.createElement("div");
  wrapper.className = 'message ' + (sender === 'user' ? 'user' : 'bot');

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = sender === 'user' ? 'You' : 'Goofy AI';
  wrapper.appendChild(meta);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br>');
  wrapper.appendChild(bubble);

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Save key for session only (not persisted)
saveKeyBtn.onclick = () => {
  const val = keyInput.value.trim();
  if (!val) return;
  API_KEY = val;
  DEMO_MODE = false;
  popup.style.display = 'none';
  addMessage('bot', 'API key saved. Say hi to Goofy AI!');
};

// Demo mode (no live API calls)
useDemoBtn.onclick = () => {
  API_KEY = null;
  DEMO_MODE = true;
  popup.style.display = 'none';
  addMessage('bot', 'Demo mode enabled. Goofy AI will use canned responses.');
};

async function callGroqChat(message) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ],
    max_tokens: 400
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("Groq API error: " + resp.status + " " + text);
  }

  const data = await resp.json();
  // Defensive check for modern-style OpenAI-compatible response
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
    return data.choices[0].message.content;
  } else if (data.choices && data.choices[0] && data.choices[0].text) {
    return data.choices[0].text;
  }
  throw new Error("Unexpected Groq response shape");
}

function cannedReply(userText) {
  // Very simple demo replies to avoid any harmful content, and to keep it playful.
  const lower = userText.toLowerCase();
  if (lower.includes('joke')) return "Why did the cookie go to the doctor? Because it felt crummy! 😄";
  if (lower.includes('name')) return "I'm Goofy AI — nice to meet you!";
  if (lower.includes('help')) return "I'm here to help! Ask me stuff like jokes, fun facts, or 'tell me about space'.";
  return "Hehe — Goofy AI is thinking of a silly answer... try asking for a joke or a fun fact!";
}

async function sendToAI(message) {
  if (DEMO_MODE) {
    // quick fake delay
    await new Promise(r => setTimeout(r, 600));
    return cannedReply(message);
  }

  if (!API_KEY) {
    alert("Please enter your Groq API key to use the live AI.");
    return "No API key provided.";
  }

  try {
    const reply = await callGroqChat(message);
    return reply;
  } catch (err) {
    console.error(err);
    return "Error calling Groq API: " + err.message;
  }
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = '';

  // show a typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'message bot';
  typingEl.innerHTML = '<div class="meta">Goofy AI</div><div class="bubble">Goofy AI is typing…</div>';
  chatBox.appendChild(typingEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  const reply = await sendToAI(text);

  // remove typing element
  typingEl.remove();

  addMessage('bot', reply);
};

// Allow pressing Enter to send
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// On first load, show the key popup
window.addEventListener('load', () => {
  popup.style.display = 'flex';
});
