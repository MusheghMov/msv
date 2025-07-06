"use server";

import { route } from "rwsdk/router";
import {
  AIGenerationRequest,
  AIGenerationResponse,
  DialogueData,
} from "@/app/types/manga";
import { parseMangaScriptV2 } from "@/app/utils/mangaScriptV2Parser";
import type { ParsedMangaScript, Scene } from "@/app/utils/mangaScriptV2Parser";
import { env } from "cloudflare:workers";

/**
 * Analyzes dialogue bubble positions to determine character placement context
 */
function analyzeCharacterPositioning(dialogues: DialogueData[]): string {
  if (!dialogues || dialogues.length === 0) {
    return "no-characters";
  }

  // Canvas dimensions from the frontend
  const CANVAS_WIDTH = 935;
  const CANVAS_HEIGHT = 1305;

  // Analyze bubble positions to infer character locations
  const characterPositions = dialogues.map((dialogue) => {
    const x = dialogue.position?.x || 0;
    const y = dialogue.position?.y || 0;

    // Determine horizontal position (left, center, right)
    let horizontalPos = "center";
    if (x < CANVAS_WIDTH * 0.33) horizontalPos = "left";
    else if (x > CANVAS_WIDTH * 0.67) horizontalPos = "right";

    // Determine vertical position (top, middle, bottom)
    let verticalPos = "middle";
    if (y < CANVAS_HEIGHT * 0.33) verticalPos = "top";
    else if (y > CANVAS_HEIGHT * 0.67) verticalPos = "bottom";

    return {
      character: dialogue.character,
      horizontal: horizontalPos,
      vertical: verticalPos,
      type: dialogue.type,
    };
  });

  // Count characters by position
  const leftCount = characterPositions.filter(
    (p) => p.horizontal === "left",
  ).length;
  const rightCount = characterPositions.filter(
    (p) => p.horizontal === "right",
  ).length;
  const centerCount = characterPositions.filter(
    (p) => p.horizontal === "center",
  ).length;

  // Determine character layout pattern
  let layoutPattern = "single";
  if (leftCount > 0 && rightCount > 0) {
    layoutPattern = "conversation"; // Characters on both sides suggest face-to-face conversation
  } else if (leftCount > 1 || rightCount > 1 || centerCount > 1) {
    layoutPattern = "group"; // Multiple characters in same area suggest group scene
  }

  // Get unique character count
  const uniqueCharacters = [
    ...new Set(characterPositions.map((p) => p.character)),
  ].length;

  return `${layoutPattern}-${uniqueCharacters}chars-L${leftCount}R${rightCount}C${centerCount}`;
}

/**
 * Extracts comprehensive script context for AI background generation
 */
function extractFullScriptContext(
  scriptText: string,
  currentDialogues: DialogueData[],
): {
  parsedScript: ParsedMangaScript | null;
  currentScene: Scene | null;
  allSceneDescriptions: string[];
  contextSummary: string;
} {
  if (!scriptText || scriptText.trim().length === 0) {
    return {
      parsedScript: null,
      currentScene: null,
      allSceneDescriptions: [],
      contextSummary: "No script context available",
    };
  }

  try {
    // Parse the full script to get structured data
    const parsedScript = parseMangaScriptV2(scriptText);

    // Find the current scene based on current dialogues
    let currentScene: Scene | null = null;
    if (currentDialogues.length > 0) {
      // Try to match current dialogues with scenes
      for (const chapter of parsedScript.chapters) {
        for (const scene of chapter.scenes) {
          // Simple matching based on dialogue content
          const sceneDialogueTexts = scene.dialogues.map((d) =>
            d.text.toLowerCase(),
          );
          const currentDialogueTexts = currentDialogues.map((d) =>
            d.dialogue.toLowerCase(),
          );

          // If any current dialogue matches scene dialogues, this is likely our scene
          const hasMatch = currentDialogueTexts.some((text) =>
            sceneDialogueTexts.some(
              (sceneText) =>
                sceneText.includes(text) || text.includes(sceneText),
            ),
          );

          if (hasMatch) {
            currentScene = scene;
            break;
          }
        }
        if (currentScene) break;
      }
    }

    // Extract all scene descriptions for context
    const allSceneDescriptions: string[] = [];
    for (const chapter of parsedScript.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.description && scene.description.trim().length > 0) {
          allSceneDescriptions.push(
            `${chapter.name} - ${scene.name}: ${scene.description}`,
          );
        }
      }
    }

    // Create a comprehensive context summary
    const totalChapters = parsedScript.chapters.length;
    const totalScenes = parsedScript.chapters.reduce(
      (sum, ch) => sum + ch.scenes.length,
      0,
    );
    const contextSummary = `Script contains ${totalChapters} chapters with ${totalScenes} scenes. ${
      currentScene
        ? `Current scene: "${currentScene.name}" - ${currentScene.description}`
        : "Scene context not identified."
    }`;

    return {
      parsedScript,
      currentScene,
      allSceneDescriptions,
      contextSummary,
    };
  } catch (error) {
    console.warn("Failed to parse script:", error);
    return {
      parsedScript: null,
      currentScene: null,
      allSceneDescriptions: [],
      contextSummary: "Script parsing failed, using dialogue-based analysis",
    };
  }
}

/**
 * Analyzes dialogue data to extract scene context for background generation
 */
function analyzeSceneContext(
  dialogues: DialogueData[],
  scriptText: string,
): string {
  // Extract character names and count
  const characters = [...new Set(dialogues.map((d) => d.character))].filter(
    (c) => c && c !== "Unknown",
  );

  // Analyze dialogue content for location/setting clues
  const allDialogue = dialogues
    .map((d) => d.dialogue)
    .join(" ")
    .toLowerCase();
  const scriptLower = scriptText.toLowerCase();

  // Location keywords mapping
  const locationKeywords = {
    school: [
      "school",
      "classroom",
      "student",
      "teacher",
      "desk",
      "blackboard",
      "study",
      "homework",
      "test",
      "lesson",
    ],
    home: [
      "home",
      "house",
      "room",
      "kitchen",
      "living room",
      "bedroom",
      "family",
      "mom",
      "dad",
      "parent",
    ],
    outdoor: [
      "park",
      "outside",
      "garden",
      "street",
      "road",
      "sky",
      "tree",
      "grass",
      "bench",
      "walk",
    ],
    office: [
      "office",
      "work",
      "meeting",
      "computer",
      "business",
      "colleague",
      "boss",
      "project",
    ],
    restaurant: [
      "restaurant",
      "cafe",
      "food",
      "eat",
      "menu",
      "table",
      "waiter",
      "coffee",
      "lunch",
      "dinner",
    ],
    hospital: [
      "hospital",
      "doctor",
      "nurse",
      "patient",
      "medicine",
      "clinic",
      "health",
    ],
    library: [
      "library",
      "book",
      "read",
      "quiet",
      "study",
      "shelf",
      "librarian",
    ],
    train: [
      "train",
      "station",
      "platform",
      "ticket",
      "travel",
      "journey",
      "rail",
    ],
    beach: [
      "beach",
      "ocean",
      "sea",
      "sand",
      "wave",
      "summer",
      "swim",
      "vacation",
    ],
  };

  // Mood/atmosphere keywords
  const moodKeywords = {
    peaceful: ["calm", "peaceful", "quiet", "serene", "relax"],
    tense: ["angry", "fight", "argue", "stress", "worry", "nervous"],
    romantic: ["love", "heart", "together", "date", "romantic", "kiss"],
    mysterious: [
      "secret",
      "mystery",
      "hidden",
      "strange",
      "mysterious",
      "dark",
    ],
    happy: ["happy", "joy", "laugh", "smile", "celebrate", "fun", "party"],
  };

  // Detect most likely location
  let detectedLocation = "generic indoor";
  let maxScore = 0;

  for (const [location, keywords] of Object.entries(locationKeywords)) {
    const score = keywords.reduce((count, keyword) => {
      return (
        count +
        (allDialogue.includes(keyword) ? 1 : 0) +
        (scriptLower.includes(keyword) ? 0.5 : 0)
      );
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedLocation = location;
    }
  }

  // Detect mood
  let detectedMood = "neutral";
  let maxMoodScore = 0;

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    const score = keywords.reduce((count, keyword) => {
      return count + (allDialogue.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > maxMoodScore) {
      maxMoodScore = score;
      detectedMood = mood;
    }
  }

  return `${detectedLocation}-${detectedMood}-${characters.length}chars`;
}

/**
 * Generates an optimized prompt for manga background generation
 */
function generateMangaBackgroundPrompt(
  context: string,
  characterPositioning: string,
  scriptContext: {
    parsedScript: ParsedMangaScript | null;
    currentScene: Scene | null;
    allSceneDescriptions: string[];
    contextSummary: string;
  },
  userPrompt?: string,
): string {
  const [location, mood, charCount] = context.split("-");

  // Parse character positioning data
  const [layoutPattern, charInfo, positions] = characterPositioning.split("-");
  const leftCount = parseInt(positions?.match(/L(\d+)/)?.[1] || "0");
  const rightCount = parseInt(positions?.match(/R(\d+)/)?.[1] || "0");
  const centerCount = parseInt(positions?.match(/C(\d+)/)?.[1] || "0");

  // Base system prompt - crucial for preventing text/characters
  const systemPrompt = `Create a manga-style background illustration with clean lines and appropriate shading. IMPORTANT: Generate ONLY the environment/background with characters, NO people, NO text, NO speech bubbles, NO dialogue boxes, and NO written words of any kind.`;

  // Character positioning context for background composition
  let compositionGuide = "";
  if (layoutPattern === "conversation" && leftCount > 0 && rightCount > 0) {
    compositionGuide =
      "Compose the scene to accommodate characters positioned for face-to-face conversation, with space on the left and right sides of the frame. Frame the background as if viewed from a medium shot perspective suitable for dialogue exchange.";
  } else if (layoutPattern === "group") {
    compositionGuide =
      "Design the background for a group scene, with open central space and natural gathering areas. Consider a wider perspective that can accommodate multiple character positions.";
  } else if (leftCount > 0 || rightCount > 0) {
    const side = leftCount > 0 ? "left" : "right";
    compositionGuide = `Frame the background with consideration for character presence on the ${side} side of the composition. Ensure visual balance with interesting background elements on the opposite side.`;
  } else {
    compositionGuide =
      "Design a balanced composition suitable for central character positioning, with engaging background elements distributed across the frame.";
  }

  // Primary scene context from current scene description
  let primarySceneContext = "";
  if (scriptContext.currentScene && scriptContext.currentScene.description) {
    primarySceneContext = `PRIMARY SCENE CONTEXT: ${scriptContext.currentScene.description}`;
  }

  // Full script context for comprehensive understanding
  let fullScriptContext = "";
  if (
    scriptContext.parsedScript &&
    scriptContext.allSceneDescriptions.length > 0
  ) {
    // Limit scene descriptions to avoid overwhelming the prompt (max 5 scenes)
    const limitedDescriptions = scriptContext.allSceneDescriptions.slice(0, 5);
    fullScriptContext = `
FULL SCRIPT CONTEXT FOR REFERENCE:
${scriptContext.contextSummary}

SCENE DESCRIPTIONS FROM SCRIPT:
${limitedDescriptions.join("\n")}

IMPORTANT: Use this context to understand the overall story setting and environment, but focus on generating a background that matches the current scene description above.`;
  }

  // Location-specific prompts (fallback if no scene description)
  const locationPrompts: Record<string, string> = {
    school:
      "Japanese school classroom with desks, chairs, blackboard, and large windows showing trees outside",
    home: "Cozy Japanese home interior with tatami mats, sliding doors, and warm lighting",
    outdoor:
      "Beautiful outdoor scene with trees, sky, and natural elements in manga art style",
    office:
      "Modern office environment with clean desks, computers, and professional atmosphere",
    restaurant:
      "Warm restaurant interior with tables, chairs, and ambient lighting",
    hospital:
      "Clean hospital corridor or room with medical equipment and sterile atmosphere",
    library: "Quiet library with tall bookshelves and reading areas",
    train: "Train station platform or train interior with seats and windows",
    beach: "Peaceful beach scene with ocean waves and sandy shore",
    generic: "Clean, simple indoor environment with good lighting",
  };

  // Mood adjustments
  const moodAdjustments: Record<string, string> = {
    peaceful: "with soft, calming lighting and serene atmosphere",
    tense: "with dramatic shadows and intense lighting",
    romantic: "with warm, soft lighting and dreamy atmosphere",
    mysterious: "with subtle shadows and intriguing atmosphere",
    happy: "with bright, cheerful lighting and vibrant colors",
    neutral: "with balanced lighting and clean composition",
  };

  const locationPrompt = locationPrompts[location] || locationPrompts.generic;
  const moodAdjustment = moodAdjustments[mood] || moodAdjustments.neutral;

  // Determine main prompt - prioritize scene description over generic location
  let mainPrompt = "";
  if (primarySceneContext) {
    // Use the actual scene description as the primary guide
    mainPrompt = userPrompt
      ? `${userPrompt} in manga art style, ${moodAdjustment}. Context: ${scriptContext.currentScene?.description}`
      : `${scriptContext.currentScene?.description} in manga art style, ${moodAdjustment}`;
  } else {
    // Fallback to keyword-based location detection
    mainPrompt = userPrompt
      ? `${userPrompt} in manga art style, ${moodAdjustment}`
      : `${locationPrompt} ${moodAdjustment}`;
  }

  const finalPrompt = `${systemPrompt}

${mainPrompt}

${primarySceneContext}

COMPOSITION GUIDANCE: ${compositionGuide}
${fullScriptContext}

Art style: Manga/anime background art, clean vector-like lines, cel-shading, appropriate depth and perspective. High quality illustration suitable for professional manga production. NO people, NO text, NO speech bubbles, NO dialogue - environment wigh characters only. The background should reflect the scene description and story context provided above.`;

  return finalPrompt;
}

/**
 * API route for generating manga backgrounds using Cloudflare Workers AI
 */
export const generateBackgroundRoute = route(
  "/api/generate-background",
  async (requestInfo: any) => {
    const { request } = requestInfo;

    // Only handle POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse request body
      const body = (await request.json()) as AIGenerationRequest;
      const { userPrompt, dialogueData, scriptText } = body;

      // Validate input
      if (!dialogueData || !Array.isArray(dialogueData)) {
        return Response.json(
          {
            success: false,
            error: "Invalid dialogue data provided",
          } as AIGenerationResponse,
          { status: 400 },
        );
      }

      // Extract comprehensive script context
      const fullScriptContext = extractFullScriptContext(
        scriptText || "",
        dialogueData,
      );

      // Analyze scene context from current page data (fallback)
      const sceneContext = analyzeSceneContext(dialogueData, scriptText || "");

      // Analyze character positioning from dialogue bubble positions
      const characterPositioning = analyzeCharacterPositioning(dialogueData);

      // Generate optimized prompt for manga backgrounds
      const prompt = generateMangaBackgroundPrompt(
        sceneContext,
        characterPositioning,
        fullScriptContext,
        userPrompt,
      );

      console.log("Generated prompt:", prompt);
      console.log("Scene context:", sceneContext);
      console.log("Character positioning:", characterPositioning);
      console.log("Full script context:", fullScriptContext.contextSummary);
      console.log("prompt lenght: ", prompt.length);

      try {
        // Call Cloudflare Workers AI with Flux model
        const aiResponse = await env.AI.run(
          "@cf/black-forest-labs/flux-1-schnell",
          {
            prompt: prompt.slice(0, 2048),
            // Optional parameters for better image generation
            num_steps: 4, // Flux schnell is optimized for fewer steps
            guidance: 1.0, // Lower guidance for more creative results
            width: 1024, // Good resolution for backgrounds
            height: 1024,
          },
        );

        // Handle AI response
        if (!aiResponse || typeof aiResponse !== "object") {
          return Response.json(
            {
              success: false,
              error: "Invalid response from AI service",
            } as AIGenerationResponse,
            { status: 500 },
          );
        }

        // The response should contain the image as base64 data
        const imageData = aiResponse.image;
        if (!imageData) {
          return Response.json(
            {
              success: false,
              error: "No image data received from AI service",
            } as AIGenerationResponse,
            { status: 500 },
          );
        }

        // Convert to data URL format for easy use in frontend
        const imageUrl = `data:image/jpeg;charset=utf-8;base64,${imageData}`;

        return Response.json({
          success: true,
          imageUrl: imageUrl,
        } as AIGenerationResponse);
      } catch (error) {
        console.error("Error calling AI service:", error);
        return Response.json(
          {
            success: false,
            error: "Error calling AI service",
          } as AIGenerationResponse,
          { status: 500 },
        );
      }
    } catch (error) {
      console.error("Error generating background:", error);

      return Response.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as AIGenerationResponse,
        { status: 500 },
      );
    }
  },
);
