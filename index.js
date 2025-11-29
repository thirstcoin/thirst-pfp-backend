const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// -----------------------------
// Thirst PFP style prompt
// -----------------------------
const STYLE_PROMPT = `
You are generating a Thirsty Chad profile picture for the $THIRST universe.

All Thirst PFPs must follow this same visual template:
- Bust-up portrait, centered in frame
- Large rounded cartoon head, shoulders visible
- Thick outer linework with thinner interior lines
- Neon comic style with saturated colors (cyan, magenta, orange, purple)
- Signature heart-shaped sunglasses and a chunky gold chain with a round medallion (keep these by default unless the concept clearly replaces them)
- Clean background with a soft neon glow ring behind the character, not a detailed environment
- Lighting from the top-left, soft shadow under the chin, subtle highlights on the glasses and chain
- Expression is confident, playful, slightly degen

All PFPs must keep the same proportions, pose, crop, and art style. Only the outfit, hairstyle, accessories, colors and theme should change so that every image still looks like part of the same Thirsty Chad Series 1 collection.
`;

// Build the full prompt
function buildPrompt(concept) {
  return (
    STYLE_PROMPT +
    '\n\nNow transform this base Chad into the following concept, while keeping the same pose, proportions, crop, and art style:\n\n' +
    concept
  );
}

// Call Gemini image API using fetch
async function generateImageFromGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set on the server');
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    GEMINI_API_KEY;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      // ask for an image as the response
      response_mime_type: 'image/png',
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error('Gemini HTTP ' + resp.status + ': ' + errText);
  }

  const data = await resp.json();
  const candidates = data.candidates || [];
  if (!candidates.length) {
    throw new Error('No candidates returned from Gemini');
  }

  const parts = (candidates[0].content && candidates[0].content.parts) || [];
  const imagePart = parts.find(
    (p) => p.inlineData || p.inline_data
  );

  if (!imagePart) {
    throw new Error('No inline image data in Gemini response');
  }

  const inline = imagePart.inlineData || imagePart.inline_data;
  const base64 = inline.data;
  const mime = inline.mimeType || inline.mime_type || 'image/png';

  // data URL we can use directly in <img src="...">
  return `data:${mime};base64,${base64}`;
}

// -----------------------------
// Routes
// -----------------------------

// health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'thirst-pfp-backend' });
});

// PFP endpoint
app.post('/pfp', async (req, res) => {
  try {
    const { concept } = req.body || {};

    if (!concept || typeof concept !== 'string') {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept' string in request body",
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Server misconfigured: GEMINI_API_KEY is missing',
      });
    }

    const trimmedConcept = concept.trim().slice(0, 200); // basic length safety
    const fullPrompt = buildPrompt(trimmedConcept);

    const imageDataUrl = await generateImageFromGemini(fullPrompt);

    return res.json({
      ok: true,
      image: imageDataUrl,
      prompt: fullPrompt,
    });
  } catch (err) {
    console.error('PFP error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to generate PFP image',
      details: err.message || String(err),
    });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});