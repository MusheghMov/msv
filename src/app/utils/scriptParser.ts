import type { DialogueData, DialogueType, Position, ScriptParseResult } from '@/app/types/manga';

/**
 * Parses a manga script text into structured dialogue data
 */
export function parseScript(scriptText: string): ScriptParseResult {
  const errors: string[] = [];
  const dialogues: DialogueData[] = [];
  
  if (!scriptText.trim()) {
    return {
      dialogues: [],
      errors: ['Script is empty'],
      isValid: false
    };
  }

  // Split script into dialogue blocks (separated by empty lines)
  const dialogueBlocks = scriptText.split(/\n\s*\n/);
  
  dialogueBlocks.forEach((block, blockIndex) => {
    const dialogue = parseDialogueBlock(block, blockIndex);
    if (dialogue.error) {
      errors.push(dialogue.error);
    } else if (dialogue.data) {
      dialogues.push(dialogue.data);
    }
  });

  return {
    dialogues,
    errors,
    isValid: errors.length === 0 && dialogues.length > 0
  };
}

/**
 * Parses a single dialogue block
 */
function parseDialogueBlock(block: string, blockIndex: number): { data?: DialogueData; error?: string } {
  const lines = block.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  
  if (lines.length === 0) {
    return {}; // Skip empty blocks (like comments)
  }

  const dialogueData: Partial<DialogueData> = {};
  
  lines.forEach(line => {
    const parts = line.split(':');
    if (parts.length < 2) return;
    
    const key = parts[0].trim().toUpperCase();
    const value = parts.slice(1).join(':').trim();
    
    switch (key) {
      case 'CHARACTER':
        dialogueData.character = value;
        break;
      case 'TYPE':
        if (isValidDialogueType(value)) {
          dialogueData.type = value as DialogueType;
        }
        break;
      case 'POSITION':
        const position = parsePosition(value);
        if (position) {
          dialogueData.position = position;
        }
        break;
      case 'DIALOGUE':
        dialogueData.dialogue = value;
        break;
    }
  });

  // Validate required fields
  const validation = validateDialogueBlock(dialogueData, blockIndex);
  if (validation.error) {
    return { error: validation.error };
  }

  return { data: dialogueData as DialogueData };
}

/**
 * Validates if a string is a valid dialogue type
 */
function isValidDialogueType(type: string): boolean {
  const validTypes: DialogueType[] = ['speech', 'thought', 'shout'];
  return validTypes.includes(type.toLowerCase() as DialogueType);
}

/**
 * Parses position string (e.g., "250, 150") into Position object
 */
function parsePosition(positionStr: string): Position | null {
  const coords = positionStr.split(',').map(s => parseInt(s.trim(), 10));
  
  if (coords.length !== 2 || coords.some(coord => isNaN(coord))) {
    return null;
  }
  
  return { x: coords[0], y: coords[1] };
}

/**
 * Validates that a dialogue block has all required fields
 */
function validateDialogueBlock(dialogue: Partial<DialogueData>, blockIndex: number): { error?: string } {
  const blockNum = blockIndex + 1;
  
  if (!dialogue.character) {
    return { error: `Block ${blockNum}: Missing CHARACTER field` };
  }
  
  if (!dialogue.type) {
    return { error: `Block ${blockNum}: Missing or invalid TYPE field (must be speech, thought, or shout)` };
  }
  
  if (!dialogue.position) {
    return { error: `Block ${blockNum}: Missing or invalid POSITION field (must be "x, y" format)` };
  }
  
  if (!dialogue.dialogue) {
    return { error: `Block ${blockNum}: Missing DIALOGUE field` };
  }
  
  // Validate position ranges (reasonable canvas bounds)
  if (dialogue.position.x < 0 || dialogue.position.x > 2000 || 
      dialogue.position.y < 0 || dialogue.position.y > 2000) {
    return { error: `Block ${blockNum}: POSITION values should be between 0 and 2000` };
  }
  
  return {};
}

/**
 * Formats dialogue data back to script text format
 */
export function formatDialogueToScript(dialogues: DialogueData[]): string {
  return dialogues.map(dialogue => {
    return [
      `CHARACTER: ${dialogue.character}`,
      `TYPE: ${dialogue.type}`,
      `POSITION: ${dialogue.position.x}, ${dialogue.position.y}`,
      `DIALOGUE: ${dialogue.dialogue}`
    ].join('\n');
  }).join('\n\n');
}

/**
 * Converts tldraw dialogue bubble shapes back to DialogueData array
 */
export function shapesToDialogues(shapes: any[]): DialogueData[] {
  const dialogues: DialogueData[] = [];
  
  // Filter for dialogue bubble shapes and sort by index
  const dialogueShapes = shapes
    .filter(shape => shape.type === 'dialogue-bubble')
    .map(shape => {
      const match = shape.id.match(/dialogue_(\d+)$/);
      const index = match ? parseInt(match[1]) : -1;
      return { shape, index };
    })
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index);

  // Convert shapes to DialogueData
  dialogueShapes.forEach(({ shape }) => {
    if (shape.props && shape.x !== undefined && shape.y !== undefined) {
      const dialogue: DialogueData = {
        character: shape.props.character || 'Unknown',
        type: shape.props.dialogueType || 'speech',
        position: { x: Math.round(shape.x), y: Math.round(shape.y) },
        dialogue: shape.props.text || ''
      };
      dialogues.push(dialogue);
    }
  });

  return dialogues;
}

/**
 * Extracts character placement instructions for AI generation
 */
export function generatePlacementInstructions(dialogues: DialogueData[]): string {
  return dialogues
    .map(data => 
      `The character '${data.character}' should be drawn near the canvas coordinates (${data.position.x}, ${data.position.y}). This character's mood and action should reflect their dialogue: "${data.dialogue}"`
    )
    .join('. ');
}