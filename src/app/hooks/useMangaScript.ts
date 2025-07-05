import { useMemo, useEffect, useState } from "react";
import type { DialogueData, ScriptParseResult } from "@/app/types/manga";
import {
  parseMangaScriptV2,
  type ParsedMangaScript,
} from "@/app/utils/mangaScriptV2Parser";
import { flattenV2ToDialogueData } from "@/app/utils/mangaScriptV2Adapters";
import dialoguesAtom from "../atoms/dialoguesAtom";
import scriptTextAtom from "../atoms/scriptTextAtom";
import { useAtom, useSetAtom } from "jotai";

interface UseMangaScriptReturn {
  scriptText: string;
  setScriptText: (text: string) => void;
  dialogues: DialogueData[];
  errors: string[];
  isValid: boolean;
  parseResult: ScriptParseResult;
  parsedScript: ParsedMangaScript | null;
}

export function useMangaScript(): UseMangaScriptReturn {
  const setDialogues = useSetAtom(dialoguesAtom);
  const [scriptText, setScriptText] = useAtom(scriptTextAtom);
  const [parsedScript, setParsedScript] = useState<ParsedMangaScript | null>(
    null,
  );

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

  useEffect(() => {
    if (parseResult.isValid) {
      setDialogues(parseResult.dialogues);
    }
  }, [parseResult.isValid, parseResult.dialogues, setDialogues]);

  return {
    scriptText,
    setScriptText,
    dialogues: parseResult.dialogues,
    errors: parseResult.errors,
    isValid: parseResult.isValid,
    parseResult,
    parsedScript,
  };
}
