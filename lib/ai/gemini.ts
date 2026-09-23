import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const gemini = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

export async function askGemini(prompt: string) {
  const result = await gemini.generateContent(prompt);

  return result.response.text();
}