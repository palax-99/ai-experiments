import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log("=== STREAMING CLAUDE ===\n");
process.stdout.write("Risposta: ");

const stream = await client.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Scrivi una breve storia di 5 righe su un developer che impara l'AI.",
    },
  ],
});

for await (const chunk of stream) {
  if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
    process.stdout.write(chunk.delta.text);
  }
}

const finalMessage = await stream.finalMessage();
console.log(`\n\n[Token usati: ${finalMessage.usage.input_tokens} input, ${finalMessage.usage.output_tokens} output]`);
