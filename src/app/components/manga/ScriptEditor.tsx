import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { useMangaScript } from "@/app/hooks/useMangaScript";
import { DEFAULT_SCRIPT } from "@/app/types/manga";
import { Badge } from "../ui/badge";

export function ScriptEditor() {
  const { scriptText, setScriptText, errors, isValid } =
    useMangaScript();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col space-y-6 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dialogue Script</h2>

        <Badge className="text-sm text-center h-min" variant="outline">
          {scriptText.trim().length === 0 ? (
            <span className="text-gray-500">Enter script to begin</span>
          ) : isValid ? (
            <span className="text-green-600">Script is valid</span>
          ) : (
            <span className="text-red-600">Please fix errors above</span>
          )}
        </Badge>
        {/* <div className="mt-2 text-sm text-center h-min"> */}
        {/*   {scriptText.trim().length === 0 ? ( */}
        {/*     <span className="text-gray-500">Enter script to begin</span> */}
        {/*   ) : isValid ? ( */}
        {/*     <span className="text-green-600">✓ Script is valid</span> */}
        {/*   ) : ( */}
        {/*     <span className="text-red-600">✗ Please fix errors above</span> */}
        {/*   )} */}
        {/* </div> */}
      </div>

      {errors.length > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-red-600">
                  {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Textarea
        value={scriptText}
        onChange={(e) => {
          setScriptText(e.target.value);
        }}
        className="w-full h-full p-4 border overflow-auto border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        placeholder="Enter your manga script here..."
      />

      <div className="flex items-center gap-4">
        <Button
          className="mt-4 w-full bg-indigo-600 text-white flex-1 py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold transition-transform transform hover:scale-105"
          disabled={!isValid && scriptText.trim().length > 0}
        >
          Render Dialogue
        </Button>
      </div>
    </div>
  );
}
