// index.js - Thirst PFP Generator Backend
// Must have `"type": "module"` in package.json

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Use your paid image-capable model
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health route
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "PFP backend alive" });
});

// Generate PFP
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || !concept.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Prompt required",
      });
    }

    console.log("PFP /pfp request concept:", concept);
    console.log("Using model:", IMAGE_MODEL);

    const model = genAI.getGenerativeModel({
      model: IMAGE_MODEL,
    });

    const promptText = `
Create a square Thirsty Chad mascot avatar based on this concept:

"${concept}"

Art direction:
- vinyl toy realism
- neon gradients
- bold crypto-degen energy
- centered PFP composition
Return ONE PNG image ONLY.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        responseMimeType: "image/png",
      },
    });

    const response = result.response;
    const candidate = response?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const imagePart = parts.find(
      (p) => p.inlineData && p.inlineData.data
    );

    if (!imagePart) {
      console.error("❌ No image data returned:", JSON.stringify(response, null, 2));
      throw new Error("No image data returned from Gemini.");
    }

    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    return res.json({ ok: true, image: dataUrl });

  } catch (err) {
    console.error("PFP /pfp error:", err);
    return res.status(500).json({
      ok: false,
      error: "PFP generation failed",
      details: err?.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PFP backend listening on port ${PORT}`);
});