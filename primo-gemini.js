import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const result = await model.generateContent("Ciao! Spiegami in 3 righe cosa sono le API.");

console.log("=== RISPOSTA GEMINI ===");
console.log(result.response.text());
console.log("======================");
