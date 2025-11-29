import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Load API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- PFP ROUTE ---
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview"  // << CORRECT MODEL
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a PFP image in PNG format based on this concept: ${concept}. 
              Return ONLY base64 inlineData PNG output.`
            }
          ]
        }
      ]
    });

    const response = await result.response;

    // Extract inline base64 data safely
    const parts = response.candidates?.[0]?.content?.parts;
    const base64 = parts?.find(p => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return res.status(500).json({
        ok: false,
        error: "No base64 image returned from Gemini."
      });
    }

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`,
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: err.message || err.toString(),
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("PFP API Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));