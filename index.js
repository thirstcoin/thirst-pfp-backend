// index.js

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Make sure this matches the env var name in Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body || {};

    if (!concept || !concept.trim()) {
      return res.status(400).json({
        ok: false,
        error: "PROMPT_REQUIRED",
        details: "Please describe your Chad so we can generate a PFP."
      });
    }

    // Use the cheaper image model (Nano Banana / 2.5 flash image)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Create a square avatar / PFP image of "Thirsty Chad" based on this concept:

"${concept}"

Style: cartoonish but premium, clean line art, strong silhouette, neon gradients, meme-ready.
Format: 1:1 aspect ratio, centered character, no text.
    `.trim();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const response = result.response;
    const parts = response?.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find(
      (p) => p.inlineData && p.inlineData.data
    );

    if (!imagePart) {
      throw new Error("No image data returned from Gemini.");
    }

    return res.json({
      ok: true,
      image: {
        mimeType: imagePart.inlineData.mimeType,
        data: imagePart.inlineData.data, // base64 image
      },
    });
  } catch (err) {
    // 🔥 Log the real error so we can see what’s wrong
    console.error("PFP /pfp error:", err?.response?.data || err);

    return res.status(500).json({
      ok: false,
      error: "GENERATION_FAILED",
      details:
        err?.response?.data ||
        err?.message ||
        "Unknown error from Gemini API.",
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`thirst-pfp-backend listening on port ${port}`);
});