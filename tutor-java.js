import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import readline from "readline";
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const conversazione = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function chiedi(domanda) {
  return new Promise((resolve) => rl.question(domanda, resolve));
}

console.log("=== TUTOR JAVA ===");
console.log("Sono il tuo assistente Java. Fammi qualsiasi domanda.");
console.log("Scrivi 'exit' per uscire.\n");

while (true) {
  const input = await chiedi("Tu: ");

  if (input.toLowerCase() === "exit") {
    console.log("Arrivederci!");
    rl.close();
    break;
  }

  conversazione.push({
    role: "user",
    content: input,
  });

  try {
    process.stdout.write("\nTutor: ");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "Sei un tutor esperto di Java. Rispondi in italiano in modo chiaro e conciso. Quando mostri codice, usa esempi pratici e semplici.",
      messages: conversazione,
    });

    let testo = "";

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        process.stdout.write(chunk.delta.text);
        testo += chunk.delta.text;
      }
    }

    const finalMessage = await stream.finalMessage();
    console.log(`\n[Token usati: ${finalMessage.usage.input_tokens} input, ${finalMessage.usage.output_tokens} output]\n`);

    conversazione.push({
      role: "assistant",
      content: testo,
    });
  } catch (errore) {
    console.log(`\n⚠️ Errore: ${errore.message}`);
    console.log("Riprova con un'altra domanda.\n");
    conversazione.pop();
  }
}
