import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Your Nano Banana API Key
const NANO_KEY = process.env.NANO_API_KEY;

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({
        ok: false,
        error: "Missing concept",
        details: "Please include a concept in your request body."
      });
    }

    // Nano Banana API Endpoint
    const response = await fetch("https://api.nanobanana.ai/v1/images/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": NANO_KEY
      },
      body: JSON.stringify({
        prompt: concept,
        size: "1024x1024",
        output_format: "base64"
      })
    });

    const data = await response.json();

    if (!response.ok || !data.image) {
      return res.status(500).json({
        ok: false,
        error: "Nano Banana API Error",
        details: JSON.stringify(data)
      });
    }

    return res.json({
      ok: true,
      image: `data:image/png;base64,${data.image}`
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: err.message || String(err)
    });
  }
});

app.get("/", (req, res) => {
  res.send("PFP API running with Nano Banana.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));