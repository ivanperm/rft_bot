const roleSelect = document.getElementById("role");
const inputsDiv = document.getElementById("inputs");
const promptBox = document.getElementById("prompt");
const messagesDiv = document.getElementById("messages");

let messages = [];

const roles = {
  "Бот 1. Развлекательный": {
    template: `Я хочу, чтобы ты вел себя как [персонаж]...`,
    fields: ["персонаж"]
  },
  "Бот 2. Учитель": {
    template: `Роль: Ты — учитель [предмет]...`,
    fields: ["предмет", "класс", "тема"]
  },
  "Бот 3. Задающий вопросы": {
    template: `Ты эксперт в области образования...`,
    fields: ["предмет", "класс", "тема"]
  }
};

function renderInputs() {
  inputsDiv.innerHTML = "";
  roles[roleSelect.value].fields.forEach(f => {
    inputsDiv.innerHTML += `<input placeholder="${f}" id="${f}" />`;
  });
  updatePrompt();
}

function updatePrompt() {
  let prompt = roles[roleSelect.value].template;

  roles[roleSelect.value].fields.forEach(f => {
    const val = document.getElementById(f)?.value || "";
    prompt = prompt.replaceAll(`[${f}]`, val);
  });

  promptBox.value = prompt;
}

roleSelect.onchange = () => {
  messages = [];
  messagesDiv.innerHTML = "";
  renderInputs();
};

document.addEventListener("input", updatePrompt);

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerText = role + ": " + text;
  messagesDiv.appendChild(div);
}

async function send() {
  const input = document.getElementById("input");
  const text = input.value;

  addMessage("Вы", text);
  messages.push({ role: "user", content: text });

  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      messages,
      systemPrompt: promptBox.value
    })
  });

  const data = await res.json();

  addMessage("ИИ", data.reply);
  messages.push({ role: "assistant", content: data.reply });

  input.value = "";
}

function clearChat() {
  messages = [];
  messagesDiv.innerHTML = "";
}

renderInputs();
