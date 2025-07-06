"use client";

import { Textarea } from "@/app/components/ui/textarea";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";
import { useMangaScript } from "@/app/hooks/useMangaScript";
import ScriptStatusBadge from "./ScriptStatusBadge";
import ScriptMetadata from "./ScriptMetadata";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/app/components/ui/hover-card";
import scriptTextAtom from "@/app/atoms/scriptTextAtom";
import { useState } from "react";
import { useSetAtom } from "jotai";

export function ScriptEditor() {
  const { scriptText, errors, parsedScript } = useMangaScript();
  const setScriptText = useSetAtom(scriptTextAtom);
  const [scriptTextValue, setScriptTextValue] = useState(scriptText);

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Manga Script
            </h2>
            <HoverCard openDelay={0}>
              <HoverCardTrigger>
                <InfoIcon className="h-4 w-4" />
              </HoverCardTrigger>
              <HoverCardContent className="w-96">
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Manga Script Syntax</h3>
                  <p className="text-sm">
                    The script is structured into Chapters, Scenes, and
                    Dialogues.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm">Chapter</h4>
                      <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                        # &lt;chapter-name&gt;
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Scene</h4>
                      <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                        * &lt;scene-name&gt;: &lt;scene-description&gt;
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Dialogue</h4>
                      <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                        &lt;character&gt;: &lt;type&gt;: [position] &lt;text&gt;
                      </p>
                      <ul className="list-disc list-inside text-xs pl-2 mt-1">
                        <li>
                          <strong>Types</strong>: <code>speech</code>,{" "}
                          <code>thought</code>, <code>shout</code>,{" "}
                          <code>whisper</code>, <code>narrator</code>
                        </li>
                        <li>
                          <strong>Position (Optional)</strong>:{" "}
                          <code>{"{x,y}"}</code>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Comment</h4>
                      <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                        // Your comment here
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Example:</h4>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                      <code>
                        # Chapter 1: The Journey Begins
                        <br />
                        * A new day: The sun rises over the village
                        <br />
                        Yuki: speech: Let's go!
                        <br />
                        // This is a comment
                      </code>
                    </pre>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
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
          value={scriptTextValue}
          onChange={(e) => {
            setScriptTextValue(e.target.value);
            setTimeout(() => {
              setScriptText(e.target.value);
            });
          }}
          placeholder="Enter your manga script here..."
          className="h-full min-h-[400px] font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
