import express from "express";
import cors from "cors";
import { GoogleAI } from "google-genai";   // ✅ correct module

const app = express();
app.use(cors());
app.use(express.json());

// Gemini client
const client = new GoogleAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// PFP generation route
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ ok: false, error: "Missing concept" });

    console.log("Using model: gemini-3-pro-image-preview");

    const result = await client.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Generate a Thirsty Chad PFP based on:

"${concept}"

Rules:
- neon degen crypto vibe
- centered PFP
- aqua-magenta glow
- sharp character art

Return ONLY a PNG image.
              `,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "1K" },
      },
    });

    const imgPart = result?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );

    if (!imgPart) throw new Error("No image returned");

    const base64 = imgPart.inlineData.data;

    return res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`
    });
  } catch (err) {
    console.error("PFP ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PFP backend running on", PORT));