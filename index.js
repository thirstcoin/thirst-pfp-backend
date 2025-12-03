// index.js

// ... other imports and setup code ...

// --- STEP 1: DEFINE THE REFERENCE IMAGE ---
// **PASTE the Base64 string of your chosen image here.**
// Replace the placeholder string below with the code you copied!
const CHAD_PFP_BASE64 = "/9j/4AAQSKZJRgABAQ...[PASTE YOUR FULL STRING HERE]..."; 

const createChadReferencePart = () => ({
  inlineData: {
    // *** ADJUSTED MIME TYPE TO MATCH CONVERTER OUTPUT ***
    mimeType: "image/jpeg", 
    data: CHAD_PFP_BASE64,
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ... Health route ...

// ---- PFP GENERATION (FINAL VERSION) ----
app.post("/pfp", async (req, res) => {
  try {
    const { concept } = req.body;

    // ... concept validation ...

    console.log("Using model: gemini-2.5-flash-image with consistent identity");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            // 1. ADD THE REFERENCE IMAGE PART HERE
            createChadReferencePart(), 
            {
              text: `
Use the attached image as the **IDENTITY ANCHOR** for the character. **DO NOT change the face, skin tone, hair style, or bust-up crop.**
Your task is to create a new PFP where the character keeps all of their original features and the style, but his clothing, props, and theme are based on the user's input:

User Input Concept: "${concept}"

Style Constraints (Maintain the original PFP style):
- bust-up character portrait
- clean circular PFP layout
- centered character
- neon degen crypto vibe
- aqua & magenta lighting
- Return ONLY a PNG image.
`
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"] 
      }
    });

    const imageData = result.response.candidates[0].content.parts[0].inlineData.data;

    res.json({
      ok: true,
      // We will still tell the client it's a PNG for consistency, 
      // but the input image data is JPEG. The model handles the conversion.
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

// ... Server start ...
