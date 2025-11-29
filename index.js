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
// PROMPT BUILDER
// ---------------------------
function buildPrompt(concept) {
  return `
You generate Thirsty Chad PFP art in a consistent neon comic style.

STYLE RULES:
- Bust-up portrait
- Large cartoon head, clean thick outlines
- Neon glow palette (cyan, magenta, purple, orange)
- Heart glasses + gold Bitcoin chain by default
- Smooth gradient background
- Confident, degen meme energy

Transform the base Chad into:

"${concept}"

OUTPUT RULES:
Return ONLY a data URL:
data:image/png;base64,AAAA...

Do NOT include text, markdown, backticks, or explanation.
`;
}

// ---------------------------
// GEMINI GENERATION
// ---------------------------
async function generateImageDataUrl(prompt) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' +
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
    const err = await resp.text();
    throw new Error('Gemini HTTP ' + resp.status + ': ' + err);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() || '';

  if (!text.startsWith('data:image')) {
    throw new Error('Model did not return data URL. Got: ' + text.slice(0, 80));
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
        error: "Missing 'concept' string in request body",
      });
    }

    const prompt = buildPrompt(concept.trim());
    const imageData = await generateImageDataUrl(prompt);

    res.json({
      ok: true,
      concept: concept.trim(),
      image: imageData,
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