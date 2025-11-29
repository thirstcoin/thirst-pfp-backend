const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ USE THIS — matches your Render environment variable EXACTLY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_PFP_KEY);

// Simple health check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// Generate PFP endpoint
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept' field",
      });
    }

    // Use a valid Gemini image model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest"
    });

    const result = await model.generateContent(concept);

    // Extract output text
    const text = result.response.text();

    res.json({
      ok: true,
      prompt: concept,
      output: text
    });
  } catch (error) {
    console.error("Gemini error:", error);

    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP image",
      details: String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});