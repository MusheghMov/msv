import { useState, useCallback } from "react";
import type { DialogueData } from "@/app/types/manga";
import { generatePlacementInstructions } from "@/app/utils/scriptParser";

interface UseBackgroundGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  backgroundUrl: string | null;
  generateBackground: (
    userPrompt: string,
    dialogues: DialogueData[],
    scriptText: string,
  ) => Promise<void>;
  setBackgroundUrl: (url: string) => void;
  clearError: () => void;
}

/**
 * Custom hook for AI background generation
 */
export function useBackgroundGeneration(): UseBackgroundGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrlState] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setBackgroundUrl = useCallback((url: string) => {
    setBackgroundUrlState(url);
    setError(null);
  }, []);

  const generateBackground = useCallback(
    async (
      userPrompt: string,
      dialogues: DialogueData[],
      scriptText: string,
    ): Promise<void> => {
      if (!userPrompt.trim()) {
        setError("Please provide a scene description.");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        // Create placement instructions based on extracted data
        const placementInstructions = generatePlacementInstructions(dialogues);

        // Construct a detailed prompt for the AI
        const fullPrompt = `Generate a manga panel image in a black and white, high-contrast ink style.
The overall scene is: ${userPrompt}.
The panel has an approximate resolution of 800x1200 pixels. Use the following instructions for character placement and actions:
${placementInstructions}.
The final image should be a complete scene showing the characters and the background.
Crucially, DO NOT render any text, words, letters, or speech bubbles in the image. The image must only contain the characters and scenery, composed to leave space for speech bubbles which will be added later.`;

        const payload = {
          instances: [{ prompt: fullPrompt }],
          parameters: { sampleCount: 1 },
        };

        // NOTE: In a real application, you would get the API key from environment variables
        // For now, this will need to be configured by the user or through environment setup
        const apiKey = ""; // API key should be injected by the environment

        if (!apiKey) {
          throw new Error(
            "AI API key not configured. Please set up your Google Imagen API key.",
          );
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as any;

        if (
          result.predictions &&
          result.predictions.length > 0 &&
          result.predictions[0].bytesBase64Encoded
        ) {
          const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
          setBackgroundUrlState(imageUrl);
        } else {
          throw new Error("API returned no image data.");
        }
      } catch (error) {
        console.error("Error generating AI background:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to generate background",
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return {
    isGenerating,
    error,
    backgroundUrl,
    generateBackground,
    setBackgroundUrl,
    clearError,
  };
}

