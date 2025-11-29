import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// KEY = GEMINI_API_KEY (keep name the same)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    // FREE MODEL → Nano Banana / Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a square PFP image. Concept: ${concept}.
                     Return ONLY base64 PNG inlineData.`
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const part = response.candidates[0].content.parts[0];

    if (!part.inlineData || !part.inlineData.data) {
      throw new Error("No image returned from model");
    }

    const base64 = part.inlineData.data;

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: err.message || String(err)
    });
  }
});

app.get("/", (req, res) => {
  res.send("PFP API is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));