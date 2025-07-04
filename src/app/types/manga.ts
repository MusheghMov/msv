// Types and interfaces for the Manga Script Visualizer

export type DialogueType = 'speech' | 'thought' | 'shout';

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

export interface BubbleStyle {
  padding: number;
  maxWidth: number;
  lineHeight: number;
  font: string;
  fillColor: string;
  strokeColor: string;
  lineWidth: number;
}

export interface BubbleDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

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

// Default script content
export const DEFAULT_SCRIPT = `# Page 1, Panel 1
CHARACTER: Kenji
TYPE: speech
POSITION: 250, 150
DIALOGUE: We have to find her... before it's too late. The fate of the entire city rests on our shoulders!

CHARACTER: Yumi
TYPE: thought
POSITION: 550, 400
DIALOGUE: He doesn't know I'm right here... Should I reveal myself?

CHARACTER: Ryo
TYPE: shout
POSITION: 400, 700
DIALOGUE: I WON'T LET YOU!`;