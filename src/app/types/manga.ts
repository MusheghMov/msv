// Types and interfaces for the Manga Script Visualizer

export type DialogueType = 'speech' | 'thought' | 'shout' | 'whisper' | 'narrator';

export interface Position {
  x: number;
  y: number;
}

export interface DialogueData {
  character: string;
  type: DialogueType;
  position: Position;
  dialogue: string;
}

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  backgroundUrl?: string;
}

export interface BubbleDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

// Re-export V2 types for compatibility
export type {
  DialogueType as V2DialogueType,
  Position as V2Position,
  Dialogue as V2Dialogue,
  Scene as V2Scene,
  Chapter as V2Chapter,
  ParseError as V2ParseError,
  ParsedMangaScript as V2ParsedMangaScript,
} from '@/app/utils/mangaScriptV2Parser';

export interface AIGenerationRequest {
  userPrompt: string;
  dialogueData: DialogueData[];
  scriptText: string;
}

export interface AIGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ScriptParseResult {
  dialogues: DialogueData[];
  errors: string[];
  isValid: boolean;
}

// Constants for canvas operations
export const CANVAS_DEFAULTS = {
  BUBBLE_PADDING: 30,
  MAX_TEXT_WIDTH: 250,
  LINE_HEIGHT: 22,
  FONT: '16px "Comic Sans MS", "Comic Sans", cursive',
  CHARACTER_FONT: 'bold 18px "Inter", sans-serif',
  FILL_COLOR: 'black',
  STROKE_COLOR: 'black',
  LINE_WIDTH: 3,
  BUBBLE_FILL: 'white'
} as const;