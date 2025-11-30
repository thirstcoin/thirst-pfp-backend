// index.js
import express from "express";
import cors from "cors";
import { GoogleAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Google client
const client = new GoogleAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Health route
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "pfp backend running" });
});

// PFP generation
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) {
      return res.status(400).json({ ok: false, error: "Missing concept" });
    }

    console.log("🔥 Using model: gemini-3-pro-image-preview");

    const result = await client.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Create a Thirsty Chad PFP using this idea:

"${concept}"

Style:
- neon crypto energy
- glowing gradients
- sharp face + clean PFP framing
Return ONLY a PNG image.
            `,
            },
          ],
        },
      ],
      output: "image",   // REQUIRED for Gemini-3 image models
    });

    // Extract the image
    const part = result.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );

    if (!part) {
      throw new Error("Model did not return an image.");
    }

    const base64 = part.inlineData.data;

    res.json({
      ok: true,
      image: `data:${part.inlineData.mimeType};base64,${base64}`,
    });
  } catch (err) {
    console.error("❌ PFP /pfp error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 PFP backend live on", PORT));