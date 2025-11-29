import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    // ⭐ FREE TIER MODEL
    const model = genAI.getGenerativeModel({
      model: "nano-banana-ml"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Generate a clean, high-quality PFP image as a square PNG based on this concept:

"${concept}"

Return ONLY the base64 encoded PNG (inlineData).
              `
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const base64 = response.candidates[0].content.parts[0].inlineData.data;

    return res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`,
    });

  } catch (err) {
    console.error("PFP ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: err.message || err.toString(),
    });
  }
});

app.get("/", (req, res) => {
  res.send("PFP API is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));