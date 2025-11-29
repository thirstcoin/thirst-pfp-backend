const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'thirst-pfp-backend' });
});

// placeholder PFP endpoint
app.post('/pfp', (req, res) => {
  const { concept } = req.body || {};

  if (!concept || typeof concept !== 'string') {
    return res.status(400).json({ error: 'Missing concept string' });
  }

  return res.json({
    ok: true,
    message: 'PFP backend is working',
    conceptReceived: concept
  });
});

app.listen(PORT, () => {
  console.log(`Thirst PFP backend running on port ${PORT}`);
});
