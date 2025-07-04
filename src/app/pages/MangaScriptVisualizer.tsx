"use client";

import { useBackgroundGeneration } from "@/app/hooks/useBackgroundGeneration";
import { ScriptEditor } from "@/app/components/manga/ScriptEditor";
import { ScriptEditorV2 } from "@/app/components/manga/ScriptEditorV2";
import { TldrawMangaCanvas } from "@/app/components/manga/TldrawMangaCanvas";

export function MangaScriptVisualizer() {
  // const {
  //   isGenerating,
  //   error: bgError,
  //   backgroundUrl,
  //   generateBackground,
  //   setBackgroundUrl,
  // } = useBackgroundGeneration();

  return (
    <div className=" grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto p-4 lg:p-8 h-screen overflow-hidden min-h-screen bg-gray-100 text-gray-800">
      <div className="flex flex-col gap-4">
        <ScriptEditorV2 />
        <ScriptEditor />
      </div>

      {/* <BackgroundControls */}
      {/*   onGenerateBackground={generateBackground} */}
      {/*   onSetBackgroundUrl={setBackgroundUrl} */}
      {/*   isGenerating={isGenerating} */}
      {/*   error={bgError} */}
      {/*   dialogues={dialogues} */}
      {/*   scriptText={scriptText} */}
      {/* /> */}

      <div
        className="bg-white rounded-2xl shadow-lg overflow-hidden relative"
        style={{ minHeight: "600px" }}
      >
        {/* <LoadingSpinner */}
        {/*   message="Generating Background..." */}
        {/*   isVisible={isGenerating} */}
        {/* /> */}

        <TldrawMangaCanvas />
      </div>
    </div>
  );
}
