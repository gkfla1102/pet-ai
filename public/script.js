// script.js
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("input");
const btn = document.getElementById("btn");

let idleTimer = null;

function addMessage(who, text) {
  const div = document.createElement("div");
  div.textContent = `${who}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    autoSpeak();
  }, 60000);
}

async function autoSpeak() {
  const msg = "사용자가 한동안 말이 없을 때 반응해줘.";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user1",
      message: msg
    })
  });

  const data = await res.json();
  addMessage("AI", data.reply);
}

btn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("You", msg);
  input.value = "";

  resetIdleTimer();

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user1",
      message: msg
    })
  });

  const data = await res.json();
  addMessage("AI", data.reply);

  resetIdleTimer();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btn.click();
});
