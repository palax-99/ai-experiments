import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Ciao! Spiegami in 3 righe cosa sono le API.",
    },
  ],
});

console.log("=== RISPOSTA CLAUDE ===");
console.log(message.content[0].text);
console.log("======================");
console.log(`Token usati: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);
