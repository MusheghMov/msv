"use client";

import { Textarea } from "@/app/components/ui/textarea";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useMangaScript } from "@/app/hooks/useMangaScript";
import ScriptStatusBadge from "./ScriptStatusBadge";
import ScriptMetadata from "./ScriptMetadata";

export function ScriptEditor() {
  const { scriptText, setScriptText, errors, parsedScript } = useMangaScript();

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Dialogue Script
          </h2>
          <ScriptStatusBadge parsedScript={parsedScript} />
        </div>

        <ScriptMetadata parsedScript={parsedScript} />
      </div>

      {errors.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <Alert className="text-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {error}
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {errors.length - 5} more error
                    {errors.length - 5 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 p-4">
        <Textarea
          value={scriptText}
          onChange={(e) => {
            setScriptText(e.target.value);
          }}
          placeholder="Enter your manga script here..."
          className="h-full min-h-[400px] font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

