// index.js
import express from "express";
import cors from "cors";
import { GoogleAI } from "google-genai"; // NEW SDK

const app = express();
app.use(cors());
app.use(express.json());

// Use your paid key (same as Playground)
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

    console.log("Using model: gemini-3-pro-image-preview");

    const result = await client.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Create a Thirsty Chad PFP based on this idea:

"${concept}"

Style rules:
- neon degen crypto vibe
- clean PFP layout 
- centered character
- sharp digital art
- glowing aqua-magenta gradients
Return a **PNG image** ONLY.
              `,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"], // REQUIRED
        imageConfig: { imageSize: "1K" }, // 1024x1024
      },
    });

    const part =
      result?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      );

    if (!part) throw new Error("Model returned no image");

    const base64 = part.inlineData.data;

    return res.json({ ok: true, image: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.error("PFP /pfp error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Image generation failed",
    });
  }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PFP backend running on", PORT));