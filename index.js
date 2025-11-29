const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Force API to use the STABLE v1 endpoint instead of v1beta
const genAI = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_PFP_KEY,
  baseUrl: "https://generativelanguage.googleapis.com/v1"
});

// Health
app.get("/", (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// PFP route
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({ ok: false, error: "Missing concept" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(concept);
    const output = result.response.text();

    res.json({
      ok: true,
      prompt: concept,
      output
    });

  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP image",
      details: String(err)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});