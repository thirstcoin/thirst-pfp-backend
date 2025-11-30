import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Gemini client
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ ok: false, error: "Missing concept" });

    console.log("Using model: gemini-3-pro-image-preview");

    const model = client.getGenerativeModel({
      model: "gemini-3-pro-image-preview"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Generate a Thirsty Chad PFP based on this idea:

"${concept}"

Style:
- neon degen crypto PFP
- centered clean layout
- aqua-magenta glow
- sharp digital render

Return ONLY a PNG image.
              `,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "1K" }
      }
    });

    const part =
      result.response.candidates[0].content.parts.find(p => p.inlineData);

    if (!part) throw new Error("No image returned");

    const base64 = part.inlineData.data;

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`
    });

  } catch (err) {
    console.error("PFP ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PFP backend running on " + PORT));