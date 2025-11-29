const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Gemini SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------
// HEALTH CHECK
// ---------------------------
app.get('/health', (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// ---------------------------
// PFP GENERATION ENDPOINT
// ---------------------------
app.post('/pfp', async (req, res) => {
  try {
    const { concept } = req.body || {};

    if (!concept || typeof concept !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept' string in request body"
      });
    }

    // SELECT MODEL (we will upgrade later to best image model)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",   // temporary starter model
    });

    // The final prompt keeps the character consistent
    const prompt = `
      Turn the THIRSTY CHAD mascot into the following version:
      ${concept}

      Style rules:
      - Keep the same cartoon proportions
      - Keep the heart sunglasses
      - Keep the sweaty “thirsty degen” look
      - Keep clean vector-style outlines
      - Keep recognizable face shape
      - No photorealism, clean toon style
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textOutput = response.text();

    res.json({
      ok: true,
      concept,
      output: textOutput
    });

  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({
      ok: false,
      error: "Gemini failed",
      details: err.message
    });
  }
});

// ---------------------------
app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});