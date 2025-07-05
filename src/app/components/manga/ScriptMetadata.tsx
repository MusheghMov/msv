import { ParsedMangaScript } from "@/app/utils/mangaScriptV2Parser";

export default function ScriptMetadata({
  parsedScript,
}: {
  parsedScript: ParsedMangaScript | null;
}) {
  if (!parsedScript?.metadata) return null;

  const { totalChapters, totalScenes, totalDialogues } = parsedScript.metadata;

  return (
    <div className="flex gap-2 text-xs text-gray-600">
      <span>
        {totalChapters} chapter{totalChapters !== 1 ? "s" : ""}
      </span>
      <span>•</span>
      <span>
        {totalScenes} scene{totalScenes !== 1 ? "s" : ""}
      </span>
      <span>•</span>
      <span>
        {totalDialogues} dialogue{totalDialogues !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
