const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Load API key from Render environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_PFP_KEY);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// PFP Generator Endpoint
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || typeof concept !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Invalid concept. Must be a text string."
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-001"  // <---- WORKING MODEL
    });

    const prompt = `
You are generating a funny cartoon PFP of "Thirsty Chad".
Everything must stay in the *exact same art style* as the Thirsty Chad image provided.

Draw Thirsty Chad as: ${concept}.
Centered composition, clean outline, bold cartoon shading, heart-shaped sunglasses, sweaty, chain, same proportions.

Output only a finished image.
`;

    const result = await model.generateContent(prompt);

    const imageResponse = result.response.candidates?.[0]?.content?.parts?.[0];

    if (!imageResponse || !imageResponse.inlineData) {
      return res.status(500).json({
        ok: false,
        error: "Gemini did not return an image."
      });
    }

    const { data, mimeType } = imageResponse.inlineData;

    res.json({
      ok: true,
      mimeType,
      imageBase64: data
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP image",
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});