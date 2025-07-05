import { useCallback, useMemo, useEffect, useState } from "react";
import type { DialogueData, ScriptParseResult } from "@/app/types/manga";
import { parseMangaScriptV2, type ParsedMangaScript } from "@/app/utils/mangaScriptV2Parser";
import { flattenV2ToDialogueData, v2ScriptToText, reconstructV2FromDialogueData } from "@/app/utils/mangaScriptV2Adapters";
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
  v2ParsedScript: ParsedMangaScript | null;
}

/**
 * Custom hook for managing manga script parsing and validation with bidirectional sync
 * Now uses V2 hierarchical parser with flat conversion for canvas compatibility
 */
export function useMangaScript(
  initialScript: string = "",
): UseMangaScriptReturn {
  const setDialogues = useSetAtom(dialoguesAtom);
  const [scriptText, setScriptText] = useAtom(scriptTextAtom);
  const [syncSource, setSyncSource] = useAtom(syncSourceAtom);
  const [v2ParsedScript, setV2ParsedScript] = useState<ParsedMangaScript | null>(null);

  // Parse V2 script and convert to flat format
  const parseResult = useMemo(() => {
    const v2Result = parseMangaScriptV2(scriptText);
    setV2ParsedScript(v2Result);
    
    // Convert to flat dialogues for canvas compatibility
    const flatDialogues = flattenV2ToDialogueData(v2Result);
    
    // Convert to V1-compatible parse result
    const v1Result: ScriptParseResult = {
      dialogues: flatDialogues,
      errors: v2Result.errors.map(error => `Line ${error.line}: ${error.error}`),
      isValid: v2Result.errors.filter(e => e.severity === 'error').length === 0
    };
    
    return v1Result;
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
    v2ParsedScript,
  };
}

