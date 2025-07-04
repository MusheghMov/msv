import { useState } from "react";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { DialogueData } from "@/app/types/manga";

interface BackgroundControlsProps {
  onGenerateBackground: (
    prompt: string,
    dialogues: DialogueData[],
    scriptText: string,
  ) => void;
  onSetBackgroundUrl: (url: string) => void;
  isGenerating: boolean;
  error: string | null;
  dialogues: DialogueData[];
  scriptText: string;
}

export function BackgroundControls({
  onGenerateBackground,
  onSetBackgroundUrl,
  isGenerating,
  error,
  dialogues,
  scriptText,
}: BackgroundControlsProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");

  const handleGenerateBackground = () => {
    if (aiPrompt.trim()) {
      onGenerateBackground(aiPrompt, dialogues, scriptText);
    }
  };

  const handleSetBackground = () => {
    if (backgroundUrl.trim()) {
      onSetBackgroundUrl(backgroundUrl);
      setBackgroundUrl("");
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Area */}
      <div>
        <h2 className="text-2xl font-bold mb-4">AI Background Generation</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Describe the scene, and let AI generate a background. The characters
          and dialogue from the script will be automatically included for
          context.
        </p>

        {/* Error Display */}
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          placeholder="e.g., A futuristic city street at night, neon signs reflecting on wet pavement..."
          disabled={isGenerating}
        />

        <Button
          onClick={handleGenerateBackground}
          disabled={isGenerating || !aiPrompt.trim() || dialogues.length === 0}
          className="mt-4 w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-semibold transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Background...
            </>
          ) : (
            "Generate Background with AI"
          )}
        </Button>

        {dialogues.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Add dialogue to your script first to generate contextual backgrounds
          </p>
        )}
      </div>
    </div>
  );
}

