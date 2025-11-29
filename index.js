const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// PFP generation endpoint
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept'"
      });
    }

    // ⭐ CORRECT MODEL NAME FOR 2025 API
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(concept);
    const text = result.response.text();

    res.json({
      ok: true,
      prompt: concept,
      output: text
    });

  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: String(err)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});