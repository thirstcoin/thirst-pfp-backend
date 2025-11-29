import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// uses GEMINI_API_KEY from Render env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || !concept.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Prompt required",
        details: "Please describe your Chad so we know what to generate.",
      });
    }

    const model = genAI.getGenerativeModel({
      // cheaper / “Nano Banana” style image model
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create a square avatar / PFP illustration based on this idea: "${concept}". 
Render it in a vibrant, meme-ready digital art style that fits a Solana degen project.`,
            },
          ],
        },
      ],
      // IMPORTANT: ask for an image
      generationConfig: {
        responseMimeType: "image/png",
      },
    });

    const response = await result.response;

    // for image responses, you get inlineData on the first part
    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64 = part?.inlineData?.data;

    if (!base64) {
      return res.status(500).json({
        ok: false,
        error: "No image returned",
        details: "The AI responded but didn’t include image data.",
      });
    }

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`,
    });
  } catch (err) {
    const msg = err?.message || String(err || "");

    // If it’s a quota / rate-limit issue, hide the ugly Google text
    if (msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("quota")) {
      return res.status(429).json({
        ok: false,
        error: "PFP generator is out of free credits",
        details: "We’ve hit the current image limit. Try again later while we refill the tank.",
      });
    }

    console.error("PFP error:", err);

    res.status(500).json({
      ok: false,
      error: "Failed to generate PFP",
      details: msg,
    });
  }
});

// simple health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "pfp-backend-online" });
});

// root
app.get("/", (_req, res) => {
  res.send("PFP API is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));