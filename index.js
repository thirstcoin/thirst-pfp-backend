// index.js
import express from "express";
import cors from "cors";
import { GoogleAI } from "google-genai";

const app = express();
app.use(cors());
app.use(express.json());

// Gemini client using your paid key
const client = new GoogleAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Health route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---- PFP GENERATION ----
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({ ok: false, error: "Missing concept" });
    }

    console.log("PFP request using Gemini 3…");

    // Gemini 3 needs responseMimeType instead of modalities
    const result = await client.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Generate a square PNG profile picture of the Thirsty Chad mascot.

Concept: "${concept}"

Style:
- neon crypto degen vibes
- vinyl-toy proportions
- bright aqua-magenta glow
- centered PFP composition
Return ONLY an image (PNG).`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "image/png", // ⭐ REQUIRED FOR IMAGES
      },
    });

    // Extract image
    const part = result?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );

    if (!part) throw new Error("Gemini 3 returned no image data.");

    const base64 = part.inlineData.data;

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`,
    });

  } catch (err) {
    console.error("PFP /pfp error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Image generation failed",
    });
  }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("PFP backend running on port", PORT)
);