import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Load env key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "PFP backend alive" });
});

// POST /pfp
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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const promptText = `
Create a high-quality Thirsty Chad PFP based on this concept:

"${concept}"

Rules:
- square PNG image
- neon, bold crypto degen colors
- head + shoulders centered
- simple gradient background
Return ONLY the PNG image.
`;

    // ---- CALL GEMINI PROPERLY ----
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: "image/png",
      },
    });

    const response = result.response;

    // ---- EXTRACT IMAGE SAFELY ----
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      p => p.inlineData && p.inlineData.data
    );

    if (!imagePart) {
      console.error("⚠ No inlineData in Gemini response:", JSON.stringify(response, null, 2).slice(0, 2000));
      throw new Error("No image data returned from Gemini.");
    }

    const base64Data = imagePart.inlineData.data;

    return res.json({
      ok: true,
      image: `data:image/png;base64,${base64Data}`,
    });

  } catch (err) {
    console.error("PFP /pfp error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "PFP generation failed.",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PFP backend listening on port ${PORT}`);
});