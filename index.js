const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// Health
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'thirst-pfp-backend' });
});

// PFP Generation
app.post('/pfp', async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || typeof concept !== 'string') {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid 'concept' field"
      });
    }

    const prompt = `
      Create a clean, solid-color-background **PFP portrait only** 
      of the cartoon character "Thirsty Chad".

      Always:
      - Maintain the same face proportions and style
      - Keep heart-shaped pink sunglasses
      - Keep short brown hair
      - Make him hydrated and sweaty (the signature look)
      - NO body, only head + neck area
      - Simple PFP background (blue, teal, purple, or gradient)

      Transform him into: ${concept}

      Return ONLY a PNG image. 
    `;

    const result = await model.generateContent(prompt);

    const imageData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!imageData) {
      return res.status(500).json({
        ok: false,
        error: "Gemini returned no image data"
      });
    }

    res.json({
      ok: true,
      image: imageData.data,
      mimeType: imageData.mimeType
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