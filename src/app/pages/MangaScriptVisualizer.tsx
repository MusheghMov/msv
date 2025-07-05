"use client";

import { ScriptEditor } from "@/app/components/manga/ScriptEditor";
import { TldrawMangaCanvas } from "@/app/components/manga/TldrawMangaCanvas";

export function MangaScriptVisualizer() {
  return (
    <div className=" grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto p-4 lg:p-8 h-screen overflow-auto min-h-screen bg-gray-100 text-gray-800">
      <ScriptEditor />

      <TldrawMangaCanvas />
    </div>
  );
}
