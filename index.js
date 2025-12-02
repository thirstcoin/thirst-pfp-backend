// index.js
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Correct client
// Make sure your GEMINI_API_KEY is available in your environment variables!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---- PFP GENERATION ----
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({ ok: false, error: "Missing concept" });
    }

    // *** FIX: Changed to the dedicated image generation model ***
    console.log("Using model: gemini-2.5-flash-image");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image" // Dedicated Image Model
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Create a Thirsty Chad PFP based on:

"${concept}"

Style:
- neon degen crypto vibe
- centered character
- clean PFP layout
- aqua & magenta lighting
Return ONLY a PNG image.
`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "image/png",
        // *** FIX: Added this crucial configuration for image models ***
        responseModalities: ["IMAGE"] 
      }
    });

    // Extract the base64 data from the response part
    const imageData = result.response.candidates[0].content.parts[0].inlineData.data;

    res.json({
      ok: true,
      image: "data:image/png;base64," + imageData
    });

  } catch (err) {
    console.error("PFP /pfp error:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PFP backend running on", PORT));
