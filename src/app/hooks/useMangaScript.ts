import { useCallback, useMemo, useEffect } from "react";
import type { DialogueData, ScriptParseResult } from "@/app/types/manga";
import { parseScript } from "@/app/utils/scriptParser";
import dialoguesAtom from "../atoms/dialoguesAtom";
import scriptTextAtom from "../atoms/scriptTextAtom";
import syncSourceAtom from "../atoms/syncSourceAtom";
import { useAtom, useSetAtom } from "jotai";

interface UseMangaScriptReturn {
  scriptText: string;
  setScriptText: (text: string) => void;
  dialogues: DialogueData[];
  errors: string[];
  isValid: boolean;
  parseResult: ScriptParseResult;
}

/**
 * Custom hook for managing manga script parsing and validation with bidirectional sync
 */
export function useMangaScript(
  initialScript: string = "",
): UseMangaScriptReturn {
  const setDialogues = useSetAtom(dialoguesAtom);
  const [scriptText, setScriptText] = useAtom(scriptTextAtom);
  const [syncSource, setSyncSource] = useAtom(syncSourceAtom);

  const parseResult = useMemo(() => {
    const res = parseScript(scriptText);
    return res;
  }, [scriptText]);

  // Update dialogues when script changes and sync source is not 'bubbles'
  useEffect(() => {
    if (parseResult.isValid && syncSource !== 'bubbles') {
      setSyncSource('text');
      setDialogues(parseResult.dialogues);
      // Reset sync source after a delay
      setTimeout(() => setSyncSource('none'), 100);
    }
  }, [parseResult.isValid, parseResult.dialogues, syncSource, setDialogues, setSyncSource]);

  const updateScriptText = useCallback((text: string) => {
    // Only update if sync source is not 'bubbles' to prevent conflicts
    if (syncSource !== 'bubbles') {
      setScriptText(text);
    }
  }, [setScriptText, syncSource]);

  return {
    scriptText,
    setScriptText: updateScriptText,
    dialogues: parseResult.dialogues,
    errors: parseResult.errors,
    isValid: parseResult.isValid,
    parseResult,
  };
}

