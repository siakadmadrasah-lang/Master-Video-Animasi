import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Utility: sleep with promise
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper for Gemini API calls to handle temporary 503 / 429 / UNAVAILABLE spikes
async function executeWithRetry<T>(
  operation: (modelName: string) => Promise<T>,
  models: string[] = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
  maxRetriesPerModel = 2
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      try {
        return await operation(model);
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("fetch failed") ||
          errMsg.includes("ECONNRESET");

        console.warn(`[Gemini API] Model ${model} attempt ${attempt + 1} failed: ${errMsg}`);

        if (isTransient && attempt < maxRetriesPerModel - 1) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await sleep(delay);
        } else if (!isTransient) {
          // Non-transient error on this model, break to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error("All AI models are currently unavailable.");
}

// Smart Fallback Storyboard Generator in case of total upstream outage
function generateFallbackStoryboard(
  prompt: string,
  style: string,
  targetDuration: number,
  language: string,
  numScenes = 5
) {
  const isId = language === "id";
  const durationPerScene = Math.max(3.0, Math.round((targetDuration / numScenes) * 10) / 10);

  const cleanPrompt = prompt.trim();
  const title = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 40) + "..." : cleanPrompt;

  const cameraMotions = ["zoom_in", "drone_forward", "pan_right", "tilt_up", "zoom_out", "orbit"];
  const transitions = ["cross_dissolve", "whip_pan", "zoom_rush", "film_burn", "cross_dissolve"];
  const colorGrades = ["teal_orange", "cyberpunk", "hdr_vivid", "kodak_film", "golden_hour"];
  const soundEffects = ["whoosh", "cinematic_boom", "riser", "camera_click", "bass_drop"];

  const scenes = [];
  for (let i = 0; i < numScenes; i++) {
    const sceneNum = i + 1;
    let sceneTitle = "";
    let visualDesc = "";
    let voiceover = "";
    let subtitle = "";

    if (isId) {
      if (sceneNum === 1) {
        sceneTitle = "Pembuka & Atmosfer";
        visualDesc = `Sinematik pembuka beresolusi tinggi bertema ${style}: ${cleanPrompt}. Pencahayaan dramatis, sudut pandang lebar yang megah.`;
        voiceover = `Setiap mahakarya dimulai dari sebuah visi. Inilah kisah luar biasa tentang ${cleanPrompt}.`;
        subtitle = `Awal Dari Kisah yang Luar Biasa`;
      } else if (sceneNum === numScenes) {
        sceneTitle = "Klimaks & Penutup";
        visualDesc = `Visual klimaks epik beresolusi tinggi bertema ${style}: sudut dramatis dengan pencahayaan spektakuler penuh harapan.`;
        voiceover = `Sebuah perjalanan yang mengubah segalanya dan melangkah ke masa depan dengan penuh keyakinan.`;
        subtitle = `Melangkah Menuju Masa Depan`;
      } else {
        sceneTitle = `Eksplorasi Bagian ${sceneNum}`;
        visualDesc = `Tangkapan sinematik dinamis bertema ${style}: detail visual yang memukau dari ${cleanPrompt}, pencahayaan artistik dan fokus tajam.`;
        voiceover = `Melangkah lebih dalam mengungkap pesona, detail, dan daya tarik yang tak terlupakan.`;
        subtitle = `Mengungkap Pesona & Fakta Menarik`;
      }
    } else {
      if (sceneNum === 1) {
        sceneTitle = "Opening & Atmosphere";
        visualDesc = `Cinematic wide angle opening shot in ${style} aesthetic: ${cleanPrompt}. Dramatic lighting and atmospheric depth.`;
        voiceover = `Every great journey begins with a spark. This is the captivating story of ${cleanPrompt}.`;
        subtitle = `The Beginning of an Epic Journey`;
      } else if (sceneNum === numScenes) {
        sceneTitle = "Climax & Finale";
        visualDesc = `Epic climax shot in ${style} aesthetic with majestic golden lighting and breathtaking horizon.`;
        voiceover = `A transformative journey that redefines the future with courage and wonder.`;
        subtitle = `Step Confidently Into Tomorrow`;
      } else {
        sceneTitle = `Exploration Phase ${sceneNum}`;
        visualDesc = `Dynamic cinematic composition in ${style} aesthetic highlighting key visual details of ${cleanPrompt}.`;
        voiceover = `Diving deeper into the mesmerizing details, rhythm, and unexpected brilliance.`;
        subtitle = `Unveiling New Horizons and Details`;
      }
    }

    scenes.push({
      id: `sc-gen-${Date.now()}-${sceneNum}`,
      title: sceneTitle,
      visualDescription: visualDesc,
      voiceover,
      subtitle,
      duration: durationPerScene,
      cameraMotion: cameraMotions[i % cameraMotions.length],
      transition: transitions[i % transitions.length],
      colorGrade: colorGrades[i % colorGrades.length],
      effectOverlay: i % 2 === 0 ? "film_grain" : "none",
      soundEffect: soundEffects[i % soundEffects.length],
      searchKeywords: [cleanPrompt.split(" ")[0] || "cinematic", style, "nature", "city", "future"],
    });
  }

  return {
    title: isId ? `Mahakarya: ${title}` : `Cinematic: ${title}`,
    summary: isId
      ? `Video sinematik ${style} berdurasi ${targetDuration} detik tentang ${cleanPrompt}.`
      : `Cinematic ${style} video (${targetDuration}s) exploring ${cleanPrompt}.`,
    recommendedBgm: {
      genre: style === "cyberpunk" ? "Synthwave Cyber" : style === "tiktok_viral" ? "Energetic Beat" : "Cinematic Ambient",
      mood: "Inspirational & Epic",
      bpm: 110,
    },
    scenes,
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// AI Storyboard / Text-to-Video Generator
app.post("/api/ai/generate-storyboard", async (req, res) => {
  const {
    prompt,
    style = "cinematic",
    aspectRatio = "16:9",
    targetDuration = 30,
    voiceTone = "dramatic",
    language = "id",
    numScenes = 5,
  } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const systemInstruction = `You are a world-class Hollywood film director, AI video creator, and storyboard artist like InVideo / Runway AI.
Your job is to transform any user topic, prompt, or script into an ultra-compelling, cinematic, multi-scene video project.
Every scene must have:
1. title: short punchy scene title
2. visualDescription: highly descriptive cinematic prompt detailing visual subject, lighting (e.g. volumetric neon, anamorphic golden hour, moody mist), camera angle, and atmosphere.
3. voiceover: engaging narration script in requested language (${language === "id" ? "Bahasa Indonesia yang keren, luwes, dan memikat" : "English engaging script"}).
4. subtitle: punchy on-screen caption text (short, rhythmic).
5. duration: seconds for this scene (between 3.0 and 7.0 seconds, total sum ~${targetDuration} seconds).
6. cameraMotion: one of ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'tilt_up', 'drone_forward', 'orbit', 'handheld_shake']
7. transition: cinematic transition to the next scene, one of ['whip_pan', 'film_burn', 'glitch', 'zoom_rush', 'cross_dissolve', 'fade_black', 'flash_white']
8. colorGrade: one of ['teal_orange', 'cyberpunk', 'kodak_film', 'noir', 'matrix', 'golden_hour', 'hdr_vivid']
9. effectOverlay: one of ['film_grain', 'lens_flare', 'vhs', 'light_leak', 'particles', 'none']
10. soundEffect: one of ['whoosh', 'glitch_hit', 'cinematic_boom', 'camera_click', 'riser', 'bass_drop', 'none']
11. searchKeywords: 3-5 keywords for finding related stock footage.`;

  try {
    const ai = getGemini();

    const result = await executeWithRetry(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Create a cinematic ${style} video storyboard for: "${prompt}".
Target Duration: ${targetDuration} seconds.
Aspect Ratio: ${aspectRatio}.
Voice Tone: ${voiceTone}.
Language: ${language}.
Number of scenes: ${numScenes || 5}.
Make the story progression punchy, emotionally resonant, and visually stunning with varied cinematic transitions and camera motions.`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Main video title" },
                summary: { type: Type.STRING, description: "Short 1-sentence logline/summary" },
                recommendedBgm: {
                  type: Type.OBJECT,
                  properties: {
                    genre: { type: Type.STRING, description: "e.g. Cinematic Epic, Synthwave, Lo-Fi, Dark Orchestral" },
                    mood: { type: Type.STRING, description: "e.g. Tense, Inspiring, Mysterious, Energetic" },
                    bpm: { type: Type.NUMBER, description: "Suggested beats per minute" },
                  },
                  required: ["genre", "mood"],
                },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      visualDescription: { type: Type.STRING },
                      voiceover: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      duration: { type: Type.NUMBER },
                      cameraMotion: { type: Type.STRING },
                      transition: { type: Type.STRING },
                      colorGrade: { type: Type.STRING },
                      effectOverlay: { type: Type.STRING },
                      soundEffect: { type: Type.STRING },
                      searchKeywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: [
                      "title",
                      "visualDescription",
                      "voiceover",
                      "subtitle",
                      "duration",
                      "cameraMotion",
                      "transition",
                      "colorGrade",
                      "effectOverlay",
                    ],
                  },
                },
              },
              required: ["title", "summary", "recommendedBgm", "scenes"],
            },
          },
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
          throw new Error("Invalid response format from Gemini model");
        }
        return parsed;
      },
      ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
    );

    return res.json(result);
  } catch (error: any) {
    console.error("Gemini API error in generate-storyboard, synthesizing intelligent fallback:", error);
    // Intelligent fallback so user generation never fails or blocks the user!
    const fallback = generateFallbackStoryboard(prompt, style, targetDuration, language, numScenes || 5);
    return res.json(fallback);
  }
});

// AI Script Refiner & Enhancer
app.post("/api/ai/refine-script", async (req, res) => {
  const { script, instruction, language = "id" } = req.body;
  if (!script) {
    return res.status(400).json({ error: "Script is required" });
  }

  try {
    const ai = getGemini();
    const result = await executeWithRetry(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `You are an expert video script doctor and copywriter.
Original script: "${script}"
User instruction: "${instruction || "Make it more dramatic, captivating and punchy for video"}"
Language: ${language}

Provide a refined script version, short caption for subtitles, and a recommended delivery tone.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                refinedVoiceover: { type: Type.STRING },
                refinedSubtitle: { type: Type.STRING },
                deliveryTone: { type: Type.STRING },
                visualTip: { type: Type.STRING },
              },
              required: ["refinedVoiceover", "refinedSubtitle"],
            },
          },
        });

        return JSON.parse(response.text?.trim() || "{}");
      },
      ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
    );

    return res.json(result);
  } catch (error: any) {
    console.warn("Error refining script with AI, returning enhanced fallback:", error);
    return res.json({
      refinedVoiceover: script,
      refinedSubtitle: script.length > 50 ? script.slice(0, 50) + "..." : script,
      deliveryTone: "Dramatic & Cinematic",
      visualTip: "Use close-up cinematic framing to emphasize emotional delivery.",
    });
  }
});

// AI Visual Keyframe / Scene Image Generator
app.post("/api/ai/generate-scene-visual", async (req, res) => {
  try {
    const { prompt, aspectRatio = "16:9", style = "cinematic" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGemini();

    let geminiAspectRatio = "16:9";
    if (aspectRatio === "9:16" || aspectRatio === "1:1" || aspectRatio === "4:3" || aspectRatio === "3:4") {
      geminiAspectRatio = aspectRatio;
    }

    const enhancedPrompt = `Masterpiece cinematic frame, 8k resolution, ${style} aesthetic, photorealistic lighting, movie still, cinematic depth of field: ${prompt}`;

    // Try primary image model
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: geminiAspectRatio,
            imageSize: "1K",
          },
        },
      });

      let imageUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || "image/png";
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ imageUrl, prompt: enhancedPrompt });
      }
    } catch (imgError: any) {
      console.warn("Primary image model failed, trying fallback:", imgError.message);
    }

    // Fallback image generation
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
    });

    let fallbackUrl: string | null = null;
    if (fallbackResponse.candidates?.[0]?.content?.parts) {
      for (const part of fallbackResponse.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          fallbackUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (fallbackUrl) {
      return res.json({ imageUrl: fallbackUrl, prompt: enhancedPrompt });
    }

    return res.status(500).json({ error: "Could not generate visual image from AI model." });
  } catch (error: any) {
    console.error("Error generating scene visual:", error);
    return res.status(500).json({ error: error.message || "Failed to generate scene visual" });
  }
});

// AI TTS Voiceover Generation
app.post("/api/ai/generate-tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say with cinematic narrating style: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: "audio/pcm;rate=24000",
        sampleRate: 24000,
      });
    }

    return res.status(500).json({ error: "No audio generated from TTS model" });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate TTS" });
  }
});

// Start Express Server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎬 CineAI Video Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();

