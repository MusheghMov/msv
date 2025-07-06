import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { DialogueData, ScriptParseResult } from "@/app/types/manga";
import {
  parseMangaScriptV2,
  type ParsedMangaScript,
} from "@/app/utils/mangaScriptV2Parser";
import {
  flattenV2ToDialogueData,
  reconstructV2FromDialogueData,
  v2ScriptToText,
} from "@/app/utils/mangaScriptV2Adapters";
import scriptTextAtom from "../atoms/scriptTextAtom";
import { useAtom } from "jotai";

interface UseMangaScriptReturn {
  scriptText: string;
  setScriptText: (text: string) => void;
  dialogues: DialogueData[];
  errors: string[];
  isValid: boolean;
  parseResult: ScriptParseResult;
  parsedScript: ParsedMangaScript | null;
  updateScriptAfterPositionChange: (updatedDialogues: DialogueData[]) => void;
}

export function useMangaScript(): UseMangaScriptReturn {
  const [scriptText, setScriptText] = useAtom(scriptTextAtom);
  const scriptTextRef = useRef(scriptText);

  const [parsedScript, setParsedScript] = useState<ParsedMangaScript | null>(
    null,
  );

  useEffect(() => {
    scriptTextRef.current = scriptText;
  }, [scriptText]);

  const parseResult = useMemo(() => {
    const res = parseMangaScriptV2(scriptText);
    setParsedScript(res);

    const flatDialogues = flattenV2ToDialogueData(res);

    return {
      dialogues: flatDialogues,
      errors: res.errors.map((error) => `Line ${error.line}: ${error.error}`),
      isValid: res.errors.filter((e) => e.severity === "error").length === 0,
    };
  }, [scriptText]);

  const updateScriptAfterPositionChange = useCallback(
    (updatedDialogues: DialogueData[]) => {
      const currentScriptText = scriptTextRef.current;
      const parsedScript = parseMangaScriptV2(currentScriptText);
      setParsedScript(parsedScript);
      if (!parsedScript) {
        return;
      }
      // Reconstruct script with updated dialogue data
      const updatedParsedScript = reconstructV2FromDialogueData(
        updatedDialogues,
        parsedScript,
      );

      const newScriptText = v2ScriptToText(updatedParsedScript);

      setScriptText(newScriptText);
    },
    [setParsedScript, setScriptText],
  );

  return {
    scriptText,
    setScriptText,
    updateScriptAfterPositionChange,
    dialogues: parseResult.dialogues,
    errors: parseResult.errors,
    isValid: parseResult.isValid,
    parseResult,
    parsedScript,
  };
}
