// src/index.js (or index.mjs if that’s what Render uses)
// Make sure package.json has: "type": "module"

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Uses GEMINI_API_KEY from Render env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "PFP backend alive" });
});

/**
 * POST /pfp
 * body: { concept: string }
 * returns: { ok: true, image: "data:image/png;base64,..." }
 */
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || !concept.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Prompt required",
        details: "Please describe your Chad so we can generate a PFP.",
      });
    }

    console.log("PFP /pfp request concept:", concept);

    // Use a paid, image-capable Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Single prompt string we’ll send to Gemini
    const promptText = `
Create a square avatar / PFP of the Thirsty Chad mascot as described here:

"${concept}"

Style:
- clean, high-quality digital art
- bold colors, neon degen crypto vibes
- centered character, full head and shoulders
- simple gradient background that works as a PFP
Return ONLY a single PNG image.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        // Tell Gemini we want an actual image back
        responseMimeType: "image/png",
      },
    });

    // 👇 IMPORTANT: with the official Node SDK the payload is under result.response
    const response = result.response;

    // Find the image part
    const imagePart =
      response?.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData && part.inlineData.data
      ) || null;

    if (!imagePart) {
      console.error("PFP /pfp error: Gemini response had no inlineData", {
        responseJSON: JSON.stringify(response, null, 2).slice(0, 2000), // trimmed
      });
      throw new Error("No image data returned from Gemini.");
    }

    const base64Data = imagePart.inlineData.data;

    if (!base64Data || typeof base64Data !== "string") {
      console.error("PFP /pfp error: inlineData.data missing or not a string");
      throw new Error("No image data returned from Gemini.");
    }

    // Send back as Data URL the front-end can drop straight into an <img src="...">
    const dataUrl = `data:image/png;base64,${base64Data}`;

    return res.json({
      ok: true,
      image: dataUrl,
    });
  } catch (err) {
    console.error("PFP /pfp error:", err);
    return res.status(500).json({
      ok: false,
      error: "PFP generation failed",
      details:
        err?.message ||
        "Unexpected error while talking to Gemini. Please try again.",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PFP backend listening on port ${PORT}`);
});