import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Database simulato
const prodotti = [
  { id: 1, nome: "Laptop Pro", prezzo: 1200, categoria: "elettronica", disponibile: true },
  { id: 2, nome: "Mouse Wireless", prezzo: 35, categoria: "elettronica", disponibile: true },
  { id: 3, nome: "Scrivania Standing", prezzo: 450, categoria: "arredamento", disponibile: false },
  { id: 4, nome: "Monitor 4K", prezzo: 600, categoria: "elettronica", disponibile: true },
  { id: 5, nome: "Sedia Ergonomica", prezzo: 380, categoria: "arredamento", disponibile: true },
];

const tools = [
  {
    name: "cerca_prodotti",
    description: "Cerca prodotti nel database per categoria o nome",
    input_schema: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Categoria prodotto (elettronica, arredamento)" },
        solo_disponibili: { type: "boolean", description: "Mostra solo prodotti disponibili" },
      },
    },
  },
  {
    name: "get_prodotto",
    description: "Ottieni dettagli di un prodotto specifico per ID",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID del prodotto" },
      },
      required: ["id"],
    },
  },
  {
    name: "calcola_totale",
    description: "Calcola il totale di più prodotti per ID",
    input_schema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "number" }, description: "Lista di ID prodotti" },
      },
      required: ["ids"],
    },
  },
];

function cerca_prodotti({ categoria, solo_disponibili }) {
  let risultati = prodotti;
  if (categoria) risultati = risultati.filter((p) => p.categoria === categoria);
  if (solo_disponibili) risultati = risultati.filter((p) => p.disponibile);
  return JSON.stringify(risultati);
}

function get_prodotto({ id }) {
  const prodotto = prodotti.find((p) => p.id === id);
  return prodotto ? JSON.stringify(prodotto) : "Prodotto non trovato";
}

function calcola_totale({ ids }) {
  const totale = ids.reduce((acc, id) => {
    const p = prodotti.find((p) => p.id === id);
    return acc + (p ? p.prezzo : 0);
  }, 0);
  return `Totale: €${totale}`;
}

async function eseguiAgente(domanda) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Utente: ${domanda}`);

  let messages = [{ role: "user", content: domanda }];

  while (true) {
    const risposta = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "Sei un assistente per un negozio online. Usa i tool disponibili per rispondere alle domande sui prodotti.",
      tools: tools,
      messages: messages,
    });

    if (risposta.stop_reason === "tool_use") {
      const toolUses = risposta.content.filter((b) => b.type === "tool_use");
      const toolResults = [];

      for (const toolUse of toolUses) {
        console.log(`\n[Tool: ${toolUse.name}(${JSON.stringify(toolUse.input)})]`);

        let risultato;
        if (toolUse.name === "cerca_prodotti") risultato = cerca_prodotti(toolUse.input);
        if (toolUse.name === "get_prodotto") risultato = get_prodotto(toolUse.input);
        if (toolUse.name === "calcola_totale") risultato = calcola_totale(toolUse.input);

        console.log(`[Risultato: ${risultato}]`);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: risultato });
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

await eseguiAgente("Quali prodotti elettronici sono disponibili?");
await eseguiAgente("Quanto costano il laptop e il monitor insieme?");
await eseguiAgente("Dammi tutti i dettagli sulla sedia ergonomica");
