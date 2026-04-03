import express from "express";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function extractText(response) {
  if (response.output_text) return response.output_text;

  if (Array.isArray(response.output)) {
    const chunks = [];

    for (const item of response.output) {
      if (Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          if (contentItem.type === "output_text" && contentItem.text) {
            chunks.push(contentItem.text);
          }
        }
      }
    }

    if (chunks.length) return chunks.join("\n");
  }

  return "";
}

app.post("/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return res.status(400).json({ error: "Не передан systemPrompt." });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages должны быть массивом." });
    }

const response = await client.responses.create({
  model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  instructions: systemPrompt,
  input: messages.map((m) => ({
    role: m.role,
    content: [
      {
        type: m.role === "assistant" ? "output_text" : "input_text",
        text: m.content
      }
    ]
  }))
});

    const reply = extractText(response);

    if (!reply) {
      return res.status(500).json({ error: "Модель не вернула текстовый ответ." });
    }

    res.json({ reply });

  } catch (e) {
    console.error("OpenAI error:", e);
    res.status(500).json({
      error: e?.message || "Ошибка OpenAI"
    });
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
