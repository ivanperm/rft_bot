const roleSelect = document.getElementById("role");
const inputsDiv = document.getElementById("inputs");
const promptBox = document.getElementById("prompt");
const messagesDiv = document.getElementById("messages");
const inputEl = document.getElementById("input");

let messages = [];

const roles = {
  "Бот 1. Развлекательный": {
    template: `Я хочу, чтобы ты вел себя как [персонаж]. Я хочу, чтобы ты реагировал и отвечал, как [персонаж], используя тон, манеру и лексику, которые использовал бы [персонаж]. Не пиши никаких объяснений. Отвечай только как [персонаж]. Ты должны обладать всеми знаниями [персонаж]. Не говори на темы, о чем [персонаж] не знает. Если [персонаж] не может знать ответ, сообщи об этом в стиле [персонаж]`,
    fields: [
      { key: "персонаж", placeholder: "Персонаж" }
    ],
    autostart: false
  },

  "Бот 2. Учитель": {
    template: `Роль: Ты — учитель [предмет] в [класс].
Задача: Объясняешь заданную [тема] понятно и структурированно.
Начни с предложения обсудить любую часть [тема].
Ограничения:
– Используй примеры.
– Проверяй понимание.
– Не перегружай терминологией.
– Не выдумывай факты.
Формат:
1. Краткое объяснение
2. Пример
3. Вопрос для проверки`,
    fields: [
      { key: "предмет", placeholder: "Предмет" },
      { key: "класс", placeholder: "Класс" },
      { key: "тема", placeholder: "Тема" }
    ],
    autostart: true
  },

  "Бот 3. Задающий вопросы": {
    template: `Ты эксперт в области образования. Ты учитель [предмет] в [класс].
Ты проводишь тестирование учеников [класс] по заданной [тема].
Твоя задача:
— задавай вопросы о [тема],
— всего в одном цикле должен быть один вопрос,
— давай уточняющие вопросы, пока не получишь верный ответ,
— после неверного ответа дай подсказку,
— давай развивающую и конструктивную обратную связь,
— после верного ответа переходи к следующему вопросу,
— будь доброжелателен и дружелюбен, используй эмодзи`,
    fields: [
      { key: "предмет", placeholder: "Предмет" },
      { key: "класс", placeholder: "Класс" },
      { key: "тема", placeholder: "Тема" }
    ],
    autostart: true
  }
};

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getCurrentRole() {
  return roles[roleSelect.value];
}

function getFieldValues() {
  const role = getCurrentRole();
  const values = {};

  role.fields.forEach(field => {
    const el = document.getElementById(`field_${field.key}`);
    values[field.key] = el ? el.value.trim() : "";
  });

  return values;
}

function buildPrompt() {
  const role = getCurrentRole();
  const values = getFieldValues();

  let prompt = role.template;
  Object.entries(values).forEach(([key, value]) => {
    prompt = prompt.replaceAll(`[${key}]`, value);
  });

  return prompt;
}

function updatePrompt() {
  promptBox.value = buildPrompt();
}

function resetChat() {
  messages = [];
  messagesDiv.innerHTML = "";
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<strong>${escapeHtml(role)}:</strong> ${escapeHtml(text)}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderInputs() {
  const role = getCurrentRole();
  inputsDiv.innerHTML = "";

  role.fields.forEach(field => {
    const input = document.createElement("input");
    input.id = `field_${field.key}`;
    input.placeholder = field.placeholder;
    input.addEventListener("input", () => {
      updatePrompt();
      resetChat();
    });
    inputsDiv.appendChild(input);
  });

  updatePrompt();
}

async function sendAutostartIfNeeded() {
  const role = getCurrentRole();
  if (!role.autostart) return;

  const values = getFieldValues();
  const hasEmpty = Object.values(values).some(v => !v);

  if (hasEmpty) return;
  if (messages.length > 0) return;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Начинай." }],
        systemPrompt: buildPrompt()
      })
    });

    const data = await res.json();
    const reply = data.reply || data.error || "Нет ответа от сервера.";

    if (!res.ok) {
      addMessage("Система", reply);
      return;
    }

    messages.push({ role: "assistant", content: reply });
    addMessage("ИИ", reply);

  } catch (err) {
    addMessage("Система", "Ошибка соединения с сервером.");
  }
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage("Вы", text);
  messages.push({ role: "user", content: text });
  inputEl.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        systemPrompt: buildPrompt()
      })
    });

    const data = await res.json();
    const reply = data.reply || data.error || "Нет ответа от сервера.";

    if (!res.ok) {
      addMessage("Система", reply);
      return;
    }

    messages.push({ role: "assistant", content: reply });
    addMessage("ИИ", reply);

  } catch (err) {
    addMessage("Система", "Ошибка соединения с сервером.");
  }
}

function clearChat() {
  resetChat();
  sendAutostartIfNeeded();
}

roleSelect.addEventListener("change", () => {
  renderInputs();
  resetChat();
  sendAutostartIfNeeded();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    send();
  }
});

renderInputs();
sendAutostartIfNeeded();
