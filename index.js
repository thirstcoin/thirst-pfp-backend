const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ---------------------------
// HEALTH CHECK
// ---------------------------
app.get('/health', (req, res) => {
  res.json({ ok: true, service: "thirst-pfp-backend" });
});

// ---------------------------
// CALL GEMINI IMAGE ENDPOINT
// ---------------------------
async function generateImageFromGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set on the server');
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateImages?key=' +
    GEMINI_API_KEY;

  const body = {
    prompt: { text: prompt },
    image_generation_config: {
      number_of_images: 1,
      aspect_ratio: "1:1"
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('Gemini HTTP ' + resp.status + ': ' + err);
  }

  const data = await resp.json();

  if (!data.images || !data.images.length) {
    throw new Error('No images returned from Gemini');
  }

  const base64 = data.images[0].data;
  return `data:image/png;base64,${base64}`;
}

// ---------------------------
// PFP GENERATION ENDPOINT
// ---------------------------
app.post('/pfp', async (req, res) => {
  try {
    const { concept } = req.body || {};

    if (!concept || typeof concept !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept' string in JSON body"
      });
    }

    // Build the character prompt
    const finalPrompt = `
      Turn the THIRSTY CHAD mascot into this version:
      ${concept}

      Style rules:
      - Keep the same cartoon proportions every time
      - Keep heart-shaped sunglasses
      - Keep sweat drops / “thirsty degen” expression
      - Clean vector-style outlines
      - Bold colors, meme energy
      - Consistent face structure for recognizability
    `;

    const imageDataUrl = await generateImageFromGemini(finalPrompt);

    res.json({
      ok: true,
      concept,
      image: imageDataUrl
    });

  } catch (err) {
    console.error("PFP ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP image",
      details: err.message
    });
  }
});

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});