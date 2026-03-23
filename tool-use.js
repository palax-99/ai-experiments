import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools = [
  {
    name: "get_weather",
    description: "Ottieni il meteo attuale di una città",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Il nome della città",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "calculate",
    description: "Esegui un calcolo matematico",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "L'espressione matematica da calcolare",
        },
      },
      required: ["expression"],
    },
  },
];

function get_weather(city) {
  const meteo = {
    Roma: "Soleggiato, 22°C",
    Milano: "Nuvoloso, 18°C",
    Napoli: "Parzialmente nuvoloso, 25°C",
  };
  return meteo[city] || `Dati meteo non disponibili per ${city}`;
}

function calculate(expression) {
  try {
    return `Risultato: ${eval(expression)}`;
  } catch {
    return "Espressione non valida";
  }
}

async function eseguiAgente(domanda) {
  console.log(`\nUtente: ${domanda}`);

  let messages = [{ role: "user", content: domanda }];

  while (true) {
    const risposta = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: tools,
      messages: messages,
    });

    if (risposta.stop_reason === "tool_use") {
      const toolUses = risposta.content.filter((b) => b.type === "tool_use");

      const toolResults = [];

      for (const toolUse of toolUses) {
        console.log(`\n[Claude usa: ${toolUse.name}(${JSON.stringify(toolUse.input)})]`);

        let risultato;
        if (toolUse.name === "get_weather") risultato = get_weather(toolUse.input.city);
        if (toolUse.name === "calculate") risultato = calculate(toolUse.input.expression);

        console.log(`[Risultato: ${risultato}]`);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: risultato,
        });
      }

      messages.push({ role: "assistant", content: risposta.content });
      messages.push({ role: "user", content: toolResults });
    } else {
      const testo = risposta.content.find((b) => b.type === "text");
      console.log(`\nClaude: ${testo.text}`);
      break;
    }
  }
}

await eseguiAgente("Che tempo fa a Roma?");
await eseguiAgente("Quanto fa 1234 * 5678?");
await eseguiAgente("Che tempo fa a Milano e quanto fa 100 + 200?");
