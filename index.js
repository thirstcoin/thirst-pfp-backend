// index.js – PFP backend (root file for Render)
// package.json should have:  "type": "module"

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Uses GEMINI_API_KEY from Render environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "PFP backend alive" });
});

/**
 * POST /pfp
 * body: { concept: string }
 * returns:
 *  - success: { ok: true, image: "data:image/png;base64,..." }
 *  - error:   { ok: false, error, details }
 */
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept || !concept.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Prompt required",
        details: "Please describe your Chad so we can generate a PFP.",
      });
    }

    console.log("PFP /pfp request concept:", concept);

    // Image-capable Gemini model (if account/tier supports image output)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const promptText = `
Create a square avatar / PFP of the Thirsty Chad mascot as described here:

"${concept}"

Style:
- clean, high-quality digital art
- bold colors, neon degen crypto vibes
- centered character, full head and shoulders
- simple gradient background that works as a PFP
Return ONLY a single PNG image.
    `.trim();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        // Ask Gemini to directly return PNG bytes
        responseMimeType: "image/png",
      },
    });

    const response = result.response;

    const imagePart =
      response?.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData && part.inlineData.data
      ) || null;

    if (!imagePart) {
      console.error("PFP /pfp error: Gemini response had no inlineData", {
        responseJSON: JSON.stringify(response, null, 2000),
      });
      throw new Error(
        "No image data returned from Gemini. (Project/tier may not support image/png responses.)"
      );
    }

    const base64Data = imagePart.inlineData.data;

    if (!base64Data || typeof base64Data !== "string") {
      console.error("PFP /pfp error: inlineData.data missing or not a string");
      throw new Error("No image data returned from Gemini.");
    }

    const dataUrl = `data:image/png;base64,${base64Data}`;

    return res.json({
      ok: true,
      image: dataUrl,
    });
  } catch (err) {
    // Log the full error object so Render logs show everything
    console.error("PFP /pfp error:", {
      message: err?.message,
      name: err?.name,
      status: err?.status,
      statusText: err?.statusText,
      errorDetails: err?.errorDetails,
      stack: err?.stack,
    });

    // If this is the "allowed mimetypes" 400 from Gemini, surface that clearly
    if (err?.status === 400) {
      return res.status(400).json({
        ok: false,
        error: "Gemini request rejected (400)",
        details:
          err?.message ||
          "Gemini did not accept this request. Your project tier may not support image/png responses – allowed types are text/json only.",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "PFP generation failed",
      details:
        err?.message ||
        "Unexpected error while talking to Gemini. Please try again.",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PFP backend listening on port ${PORT}`);
});