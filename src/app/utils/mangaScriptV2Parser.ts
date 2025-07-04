import { z } from "zod";

// Zod Schemas
const DialogueTypeSchema = z.enum([
  "speech",
  "thought",
  "shout",
  "whisper",
  "narrator",
]);

const PositionSchema = z.object({
  x: z.number().int().min(0).max(2000),
  y: z.number().int().min(0).max(1200),
});

const DialogueSchema = z.object({
  id: z.string().uuid(),
  character: z.string().min(1),
  type: DialogueTypeSchema,
  text: z.string(),
  position: PositionSchema.optional(),
  sceneId: z.string().uuid(),
  chapterId: z.string().uuid(),
  lineNumber: z.number().int().positive(),
});

const SceneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  dialogues: z.array(DialogueSchema),
  chapterId: z.string().uuid(),
  lineNumber: z.number().int().positive(),
});

const ChapterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  scenes: z.array(SceneSchema),
  lineNumber: z.number().int().positive(),
});

const ParseErrorSchema = z.object({
  line: z.number().int().positive(),
  content: z.string(),
  error: z.string(),
  severity: z.enum(["warning", "error"]),
});

const ParsedMangaScriptSchema = z.object({
  chapters: z.array(ChapterSchema),
  errors: z.array(ParseErrorSchema),
  metadata: z.object({
    totalChapters: z.number().int().nonnegative(),
    totalScenes: z.number().int().nonnegative(),
    totalDialogues: z.number().int().nonnegative(),
    parseDate: z.string(),
  }),
});

// Types
export type DialogueType = z.infer<typeof DialogueTypeSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Dialogue = z.infer<typeof DialogueSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type ParseError = z.infer<typeof ParseErrorSchema>;
export type ParsedMangaScript = z.infer<typeof ParsedMangaScriptSchema>;

// Parser State
interface ParserState {
  currentChapter: Chapter | null;
  currentScene: Scene | null;
  chapters: Chapter[];
  errors: ParseError[];
  lineNumber: number;
}

/**
 * Generates a UUID using crypto.randomUUID() with fallback
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Adds an error to the parser state
 */
function addError(
  state: ParserState,
  content: string,
  error: string,
  severity: "warning" | "error" = "error",
): void {
  state.errors.push({
    line: state.lineNumber,
    content,
    error,
    severity,
  });
}

/**
 * Parses a chapter line (# Chapter Name)
 */
function parseChapterLine(line: string, state: ParserState): boolean {
  const match = line.match(/^#\s+(.+)$/);
  if (!match) {
    addError(state, line, "Invalid chapter format. Expected: # Chapter Name");
    return false;
  }

  const chapterName = match[1].trim();
  if (!chapterName) {
    addError(state, line, "Chapter name cannot be empty");
    return false;
  }

  // Save current chapter if exists
  if (state.currentChapter) {
    state.chapters.push(state.currentChapter);
  }

  // Create new chapter
  state.currentChapter = {
    id: generateUUID(),
    name: chapterName,
    scenes: [],
    lineNumber: state.lineNumber,
  };

  // Reset current scene
  state.currentScene = null;

  return true;
}

/**
 * Parses a scene line (* Scene Name: Description)
 */
function parseSceneLine(line: string, state: ParserState): boolean {
  const match = line.match(/^\*\s+([^:]+):\s*(.+)$/);
  if (!match) {
    addError(
      state,
      line,
      "Invalid scene format. Expected: * Scene Name: Description",
    );
    return false;
  }

  const sceneName = match[1].trim();
  const sceneDescription = match[2].trim();

  if (!sceneName) {
    addError(state, line, "Scene name cannot be empty");
    return false;
  }

  if (!sceneDescription) {
    addError(state, line, "Scene description cannot be empty");
    return false;
  }

  // Ensure we have a current chapter
  if (!state.currentChapter) {
    addError(
      state,
      line,
      "Scene found without chapter. Creating default chapter.",
      "warning",
    );
    state.currentChapter = {
      id: generateUUID(),
      name: "Default Chapter",
      scenes: [],
      lineNumber: state.lineNumber,
    };
  }

  // Save current scene if exists
  if (state.currentScene) {
    state.currentChapter.scenes.push(state.currentScene);
  }

  // Create new scene
  state.currentScene = {
    id: generateUUID(),
    name: sceneName,
    description: sceneDescription,
    dialogues: [],
    chapterId: state.currentChapter.id,
    lineNumber: state.lineNumber,
  };

  return true;
}

/**
 * Parses a position string {x,y}
 */
function parsePosition(positionStr: string): Position | null {
  const match = positionStr.match(/^\{(\d+),(\d+)\}$/);
  if (!match) {
    return null;
  }

  const x = parseInt(match[1], 10);
  const y = parseInt(match[2], 10);

  if (isNaN(x) || isNaN(y)) {
    return null;
  }

  return { x, y };
}

/**
 * Parses a dialogue line (Character: Type: [Position] Text)
 */
function parseDialogueLine(line: string, state: ParserState): boolean {
  // Pattern: Character: Type: [Position] Text
  const match = line.match(/^([^:]+):\s*([^:]+):\s*(.*)$/);
  if (!match) {
    addError(
      state,
      line,
      "Invalid dialogue format. Expected: Character: Type: [Position] Text",
    );
    return false;
  }

  const character = match[1].trim();
  const typeStr = match[2].trim();
  const remainder = match[3].trim();

  if (!character) {
    addError(state, line, "Character name cannot be empty");
    return false;
  }

  // Validate dialogue type
  const dialogueTypeResult = DialogueTypeSchema.safeParse(typeStr);
  if (!dialogueTypeResult.success) {
    addError(
      state,
      line,
      `Invalid dialogue type: ${typeStr}. Must be one of: speech, thought, shout, whisper, narrator. Defaulting to 'speech'.`,
      "warning",
    );
  }
  const dialogueType: DialogueType = dialogueTypeResult.success
    ? dialogueTypeResult.data
    : "speech";

  // Parse position and text
  let position: Position | undefined;
  let text: string = remainder;

  // Check if remainder starts with position
  const positionMatch = remainder.match(/^(\{[^}]+\})\s*(.*)$/);
  if (positionMatch) {
    const positionStr = positionMatch[1];
    const parsedPosition = parsePosition(positionStr);

    if (parsedPosition) {
      const positionResult = PositionSchema.safeParse(parsedPosition);
      if (positionResult.success) {
        position = positionResult.data;
        text = positionMatch[2];
      } else {
        addError(
          state,
          line,
          `Invalid position coordinates: ${positionStr}. Position must be {x,y} where x is 0-2000 and y is 0-1200.`,
          "warning",
        );
        text = remainder;
      }
    } else {
      addError(
        state,
        line,
        `Invalid position format: ${positionStr}. Expected format: {x,y}`,
        "warning",
      );
      text = remainder;
    }
  }

  // Ensure we have current chapter and scene
  if (!state.currentChapter) {
    addError(
      state,
      line,
      "Dialogue found without chapter. Creating default chapter.",
      "warning",
    );
    state.currentChapter = {
      id: generateUUID(),
      name: "Default Chapter",
      scenes: [],
      lineNumber: state.lineNumber,
    };
  }

  if (!state.currentScene) {
    addError(
      state,
      line,
      "Dialogue found without scene. Creating default scene.",
      "warning",
    );
    state.currentScene = {
      id: generateUUID(),
      name: "Default Scene",
      description: "Auto-generated scene for orphaned dialogue",
      dialogues: [],
      chapterId: state.currentChapter.id,
      lineNumber: state.lineNumber,
    };
  }

  // Create dialogue
  const dialogue: Dialogue = {
    id: generateUUID(),
    character,
    type: dialogueType,
    text,
    position,
    sceneId: state.currentScene.id,
    chapterId: state.currentChapter.id,
    lineNumber: state.lineNumber,
  };

  state.currentScene.dialogues.push(dialogue);

  return true;
}

/**
 * Parses a single line of the manga script
 */
function parseLine(line: string, state: ParserState): void {
  const trimmedLine = line.trim();

  // Skip empty lines and comments
  if (!trimmedLine || trimmedLine.startsWith("//")) {
    return;
  }

  // Determine line type and parse accordingly
  if (trimmedLine.startsWith("#")) {
    parseChapterLine(trimmedLine, state);
  } else if (trimmedLine.startsWith("*")) {
    parseSceneLine(trimmedLine, state);
  } else if (trimmedLine.includes(":")) {
    parseDialogueLine(trimmedLine, state);
  } else {
    addError(
      state,
      trimmedLine,
      "Unrecognized line format. Expected chapter (#), scene (*), or dialogue (Character: Type: Text)",
    );
  }
}

/**
 * Finalizes the parser state and returns the result
 */
function finalizeParserState(state: ParserState): ParsedMangaScript {
  // Add current scene to current chapter if exists
  if (state.currentScene && state.currentChapter) {
    state.currentChapter.scenes.push(state.currentScene);
  }

  // Add current chapter to chapters if exists
  if (state.currentChapter) {
    state.chapters.push(state.currentChapter);
  }

  // Calculate metadata
  const totalScenes = state.chapters.reduce(
    (sum, chapter) => sum + chapter.scenes.length,
    0,
  );
  const totalDialogues = state.chapters.reduce(
    (sum, chapter) =>
      sum +
      chapter.scenes.reduce(
        (sceneSum, scene) => sceneSum + scene.dialogues.length,
        0,
      ),
    0,
  );

  const result: ParsedMangaScript = {
    chapters: state.chapters,
    errors: state.errors,
    metadata: {
      totalChapters: state.chapters.length,
      totalScenes,
      totalDialogues,
      parseDate: new Date().toISOString(),
    },
  };

  // Validate the result with Zod
  const validationResult = ParsedMangaScriptSchema.safeParse(result);
  if (!validationResult.success) {
    console.warn("Parser result validation failed:", validationResult.error);
    // Return the result anyway, but add validation errors
    result.errors.push({
      line: 0,
      content: "Parser validation",
      error:
        "Parser output validation failed: " + validationResult.error.message,
      severity: "warning",
    });
  }

  return result;
}

/**
 * Main parsing function for Manga Script v2.0
 *
 * @param scriptText - The manga script text to parse
 * @returns ParsedMangaScript - Always returns valid JSON, never throws
 */
export function parseMangaScriptV2(scriptText: string): ParsedMangaScript {
  // Initialize parser state
  const state: ParserState = {
    currentChapter: null,
    currentScene: null,
    chapters: [],
    errors: [],
    lineNumber: 0,
  };

  try {
    // Split text into lines and process each one
    const lines = scriptText.split(/\r?\n/);

    for (const line of lines) {
      state.lineNumber++;
      parseLine(line, state);
    }

    return finalizeParserState(state);
  } catch (error) {
    // This should never happen, but provide a fallback
    console.error("Unexpected error in manga script parser:", error);

    return {
      chapters: [],
      errors: [
        {
          line: state.lineNumber,
          content: "Parser error",
          error: `Unexpected parser error: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "error",
        },
      ],
      metadata: {
        totalChapters: 0,
        totalScenes: 0,
        totalDialogues: 0,
        parseDate: new Date().toISOString(),
      },
    };
  }
}

/**
 * Utility function to get all dialogues from a parsed script in flat array
 */
export function getAllDialogues(parsedScript: ParsedMangaScript): Dialogue[] {
  return parsedScript.chapters.flatMap((chapter) =>
    chapter.scenes.flatMap((scene) => scene.dialogues),
  );
}

/**
 * Utility function to find a dialogue by ID
 */
export function findDialogueById(
  parsedScript: ParsedMangaScript,
  id: string,
): Dialogue | null {
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (const dialogue of scene.dialogues) {
        if (dialogue.id === id) {
          return dialogue;
        }
      }
    }
  }
  return null;
}

/**
 * Utility function to find a scene by ID
 */
export function findSceneById(
  parsedScript: ParsedMangaScript,
  id: string,
): Scene | null {
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      if (scene.id === id) {
        return scene;
      }
    }
  }
  return null;
}

/**
 * Utility function to find a chapter by ID
 */
export function findChapterById(
  parsedScript: ParsedMangaScript,
  id: string,
): Chapter | null {
  return parsedScript.chapters.find((chapter) => chapter.id === id) || null;
}

