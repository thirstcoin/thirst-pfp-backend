const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// ---------------------------
// HEALTH CHECK
// ---------------------------
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'thirst-pfp-backend' });
});

// ---------------------------
// BUILD PROMPT
// ---------------------------
function buildPrompt(concept) {
  return `
You are generating a Thirsty Chad profile picture for the $THIRST universe.

Style rules (MUST follow every time):
- Bust-up portrait, centered in frame
- Large rounded cartoon head, shoulders visible
- Thick clean linework, bold outlines
- Neon comic style with saturated colors (cyan, magenta, orange, purple)
- Heart-shaped sunglasses and chunky gold Bitcoin medallion chain by default
- Clean gradient or glow background, not a detailed scene
- Confident, slightly degen meme expression
- Keep face shape, proportions, and pose consistent across all images

Now transform this base Thirsty Chad into the following concept, changing ONLY outfit, accessories, hairstyle, colors, and theme, while keeping the same head/body proportions and style:

"${concept}"

IMPORTANT OUTPUT INSTRUCTIONS:
- Generate a high-quality PNG image of this character.
- Then encode the PNG as base64.
- Respond with ONLY a single line that is a valid data URL in this exact format:
  data:image/png;base64,AAAA...
- Do NOT include any extra text, markdown, JSON, backticks, or explanation.
Just output the data URL string.
`;
}

// ---------------------------
// CALL GEMINI TEXT ENDPOINT (IMAGE AS BASE64 TEXT)
// ---------------------------
async function generateImageDataUrl(prompt) {
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
      temperature: 0.9,
      maxOutputTokens: 2048,
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
  const text = parts.map((p) => p.text || '').join('').trim();

  if (!text.startsWith('data:image')) {
    throw new Error('Model did not return a data URL. Got: ' + text.slice(0, 80));
  }

  return text;
}

// ---------------------------
// PFP ENDPOINT
// ---------------------------
app.post('/pfp', async (req, res) => {
  try {
    const { concept } = req.body || {};

    if (!concept || typeof concept !== 'string') {
      return res.status(400).json({
        ok: false,
        error: "Missing 'concept' string in JSON body",
      });
    }

    const trimmedConcept = concept.trim().slice(0, 200);
    const fullPrompt = buildPrompt(trimmedConcept);

    const imageDataUrl = await generateImageDataUrl(fullPrompt);

    return res.json({
      ok: true,
      concept: trimmedConcept,
      image: imageDataUrl,
    });
  } catch (err) {
    console.error('PFP ERROR:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to generate PFP image',
      details: err.message || String(err),
    });
  }
});

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});