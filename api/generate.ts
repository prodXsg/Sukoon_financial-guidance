import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, model, config } = req.body || {};

  if (typeof prompt !== "string" || prompt.length > 20000 || typeof model !== "string") {
    return res.status(400).json({ error: "Bad Request: Invalid prompt or model" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    let text = "";
    if (typeof response?.text === "string") {
      text = response.text;
    } else if (typeof (response as any)?.text === "function") {
      text = (response as any).text();
    } else if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part && typeof part.text === "string") {
          text = part.text;
          break;
        }
      }
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini upstream error in api/generate");
    return res.status(502).json({ error: "Upstream error" });
  }
}
