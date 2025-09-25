const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

const client = axios.create({
  baseURL: config.ollamaUrl,
  timeout: parseInt(config.ollamaTimeout, 10) || 120000,
});

async function askOllamaExtractLocation(userQuestion) {
  const prompt = `
You are an assistant that extracts a short location query from a user request.
Input: "${userQuestion}"
Task: Output ONLY a short search query (no explanation), e.g. "best bakso malang" or "coffee near kota bekasi".
If cannot find a location, return "NO_LOCATION".
  `.trim();

  try {
    const resp = await client.post("/api/generate", {
      model: config.ollamaModel || "mistral",
      prompt,
      stream: false,
      max_tokens: 64,
    });

    const body = resp.data;
    let text = "";

    if (body && typeof body.response === "string") {
      text = body.response.trim();
    } else if (body && body.output && Array.isArray(body.output)) {
      text = body.output.map((o) => o.content).join(" ");
    } else {
      text = "";
    }

    if (!text) return "NO_LOCATION";

    const firstLine = text.split("\n")[0].trim();
    return firstLine.replace(/^["']|["']$/g, "");
  } catch (err) {
    logger.error("Ollama error", { message: err.message });
    throw new Error("LLM service unavailable");
  }
}

async function askOllamaFallbackAnswer(userQuestion) {
  const prompt = `
You are a conversational assistant. 
The user asked: "${userQuestion}".

1. If the location is unclear or cannot be found, respond naturally (not robotic).
2. Politely explain that no exact location was found.
3. Suggest 2-3 alternative keywords the user might try, based on their question.
4. Keep it short, natural, and friendly.

Example:
"I'm not sure where exactly you mean. Maybe you could try with 'Bali beach' or 'Jakarta old town'?"

Output ONLY the natural reply, no explanation.
  `.trim();

  try {
    const resp = await client.post("/api/generate", {
      model: config.ollamaModel || "mistral",
      prompt,
      stream: false,
      max_tokens: 100,
    });

    let text = resp.data?.response?.trim() || "";
    if (!text)
      return "Maaf, saya belum bisa memahami lokasi dari pertanyaan Anda.";
    return text;
  } catch (err) {
    logger.error("Ollama fallback error", { message: err.message });
    return "Maaf, saya tidak menemukan lokasi untuk pertanyaan ini.";
  }
}

module.exports = { askOllamaExtractLocation, askOllamaFallbackAnswer };
