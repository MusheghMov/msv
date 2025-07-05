import { DialogueData } from '@/app/types/manga';
import { 
  ParsedMangaScript, 
  Dialogue as V2Dialogue,
  Scene as V2Scene,
  Chapter as V2Chapter 
} from './mangaScriptV2Parser';

/**
 * Converts hierarchical V2 script data to flat DialogueData array for canvas rendering
 */
export function flattenV2ToDialogueData(parsedScript: ParsedMangaScript): DialogueData[] {
  const dialogues: DialogueData[] = [];
  
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (const dialogue of scene.dialogues) {
        dialogues.push({
          id: dialogue.id, // Preserve UUID for bidirectional sync
          character: dialogue.character,
          type: dialogue.type,
          position: dialogue.position || { x: 100, y: 100 }, // Default position if none provided
          dialogue: dialogue.text
        });
      }
    }
  }
  
  return dialogues;
}

/**
 * Extracts all V2 dialogues from parsed script with context metadata
 */
export function getAllV2Dialogues(parsedScript: ParsedMangaScript): Array<V2Dialogue & {
  chapterName: string;
  sceneName: string;
  sceneDescription: string;
}> {
  const enrichedDialogues: Array<V2Dialogue & {
    chapterName: string;
    sceneName: string;
    sceneDescription: string;
  }> = [];
  
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (const dialogue of scene.dialogues) {
        enrichedDialogues.push({
          ...dialogue,
          chapterName: chapter.name,
          sceneName: scene.name,
          sceneDescription: scene.description
        });
      }
    }
  }
  
  return enrichedDialogues;
}

/**
 * Attempts to reconstruct V2 hierarchical structure from flat DialogueData array
 * This is used for reverse conversion when editing bubbles directly
 */
export function reconstructV2FromDialogueData(
  dialogues: DialogueData[], 
  originalScript?: ParsedMangaScript
): ParsedMangaScript {
  // If we have the original script structure, try to maintain it
  if (originalScript && originalScript.chapters.length > 0) {
    return updateV2ScriptWithDialogues(originalScript, dialogues);
  }
  
  // Otherwise create a basic structure
  const chapter: V2Chapter = {
    id: crypto.randomUUID(),
    name: 'Default Chapter',
    scenes: [],
    lineNumber: 1
  };
  
  const scene: V2Scene = {
    id: crypto.randomUUID(),
    name: 'Default Scene',
    description: 'Generated scene from dialogue bubbles',
    dialogues: [],
    chapterId: chapter.id,
    lineNumber: 2
  };
  
  // Convert dialogues
  let lineNumber = 3;
  for (const dialogue of dialogues) {
    const v2Dialogue: V2Dialogue = {
      id: dialogue.id || crypto.randomUUID(), // Preserve existing UUID or generate new one
      character: dialogue.character,
      type: dialogue.type,
      text: dialogue.dialogue,
      position: dialogue.position,
      sceneId: scene.id,
      chapterId: chapter.id,
      lineNumber: lineNumber++
    };
    scene.dialogues.push(v2Dialogue);
  }
  
  chapter.scenes.push(scene);
  
  return {
    chapters: [chapter],
    errors: [],
    metadata: {
      totalChapters: 1,
      totalScenes: 1,
      totalDialogues: dialogues.length,
      parseDate: new Date().toISOString()
    }
  };
}

/**
 * Updates an existing V2 script structure with new dialogue data
 * Preserves the hierarchical structure while updating dialogue content
 */
function updateV2ScriptWithDialogues(
  originalScript: ParsedMangaScript,
  newDialogues: DialogueData[]
): ParsedMangaScript {
  let dialogueIndex = 0;
  const updatedChapters: V2Chapter[] = [];
  
  for (const chapter of originalScript.chapters) {
    const updatedScenes: V2Scene[] = [];
    
    for (const scene of chapter.scenes) {
      const updatedDialogues: V2Dialogue[] = [];
      
      // Update existing dialogues or create new ones
      for (let i = 0; i < scene.dialogues.length && dialogueIndex < newDialogues.length; i++) {
        const originalDialogue = scene.dialogues[i];
        const newDialogue = newDialogues[dialogueIndex];
        
        updatedDialogues.push({
          ...originalDialogue,
          id: newDialogue.id || originalDialogue.id, // Preserve new UUID or keep original
          character: newDialogue.character,
          type: newDialogue.type,
          text: newDialogue.dialogue,
          position: newDialogue.position
        });
        
        dialogueIndex++;
      }
      
      updatedScenes.push({
        ...scene,
        dialogues: updatedDialogues
      });
    }
    
    updatedChapters.push({
      ...chapter,
      scenes: updatedScenes
    });
  }
  
  // If there are remaining dialogues, add them to the last scene
  if (dialogueIndex < newDialogues.length) {
    const lastChapter = updatedChapters[updatedChapters.length - 1];
    const lastScene = lastChapter.scenes[lastChapter.scenes.length - 1];
    
    for (let i = dialogueIndex; i < newDialogues.length; i++) {
      const dialogue = newDialogues[i];
      lastScene.dialogues.push({
        id: dialogue.id || crypto.randomUUID(), // Preserve existing UUID or generate new one
        character: dialogue.character,
        type: dialogue.type,
        text: dialogue.dialogue,
        position: dialogue.position,
        sceneId: lastScene.id,
        chapterId: lastChapter.id,
        lineNumber: lastScene.dialogues.length + 3 // Approximate line number
      });
    }
  }
  
  return {
    ...originalScript,
    chapters: updatedChapters,
    metadata: {
      ...originalScript.metadata,
      totalDialogues: newDialogues.length,
      parseDate: new Date().toISOString()
    }
  };
}

/**
 * Converts V2 script back to text format for editing
 */
export function v2ScriptToText(parsedScript: ParsedMangaScript): string {
  const lines: string[] = [];
  
  for (const chapter of parsedScript.chapters) {
    lines.push(`# ${chapter.name}`);
    lines.push(''); // Empty line after chapter
    
    for (const scene of chapter.scenes) {
      lines.push(`* ${scene.name}: ${scene.description}`);
      lines.push(''); // Empty line after scene
      
      for (const dialogue of scene.dialogues) {
        const positionStr = dialogue.position 
          ? `{${dialogue.position.x},${dialogue.position.y}} ` 
          : '';
        lines.push(`${dialogue.character}: ${dialogue.type}: ${positionStr}${dialogue.text}`);
      }
      
      lines.push(''); // Empty line after dialogues
    }
  }
  
  return lines.join('\n').trim();
}

/**
 * Gets summary statistics from parsed V2 script
 */
export function getV2ScriptStats(parsedScript: ParsedMangaScript) {
  return {
    chapters: parsedScript.chapters.length,
    scenes: parsedScript.chapters.reduce((sum, chapter) => sum + chapter.scenes.length, 0),
    dialogues: parsedScript.chapters.reduce((sum, chapter) => 
      sum + chapter.scenes.reduce((sceneSum, scene) => sceneSum + scene.dialogues.length, 0), 0
    ),
    errors: parsedScript.errors.length,
    errorCount: parsedScript.errors.filter(e => e.severity === 'error').length,
    warningCount: parsedScript.errors.filter(e => e.severity === 'warning').length
  };
}

/**
 * Creates a UUID->DialogueData Map for efficient lookups
 */
export function createDialogueUUIDMap(dialogues: DialogueData[]): Map<string, DialogueData> {
  const map = new Map<string, DialogueData>();
  for (const dialogue of dialogues) {
    map.set(dialogue.id, dialogue);
  }
  return map;
}

/**
 * Creates a UUID->V2Dialogue Map from parsed script for efficient lookups
 */
export function createV2DialogueUUIDMap(parsedScript: ParsedMangaScript): Map<string, V2Dialogue> {
  const map = new Map<string, V2Dialogue>();
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (const dialogue of scene.dialogues) {
        map.set(dialogue.id, dialogue);
      }
    }
  }
  return map;
}

/**
 * Finds a dialogue by UUID in the parsed script
 */
export function findDialogueByUUID(parsedScript: ParsedMangaScript, uuid: string): V2Dialogue | null {
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (const dialogue of scene.dialogues) {
        if (dialogue.id === uuid) {
          return dialogue;
        }
      }
    }
  }
  return null;
}

/**
 * Updates a specific dialogue by UUID in the parsed script
 */
export function updateDialogueByUUID(
  parsedScript: ParsedMangaScript, 
  uuid: string, 
  updates: Partial<Pick<V2Dialogue, 'character' | 'type' | 'text' | 'position'>>
): boolean {
  for (const chapter of parsedScript.chapters) {
    for (const scene of chapter.scenes) {
      for (let i = 0; i < scene.dialogues.length; i++) {
        if (scene.dialogues[i].id === uuid) {
          scene.dialogues[i] = {
            ...scene.dialogues[i],
            ...updates
          };
          return true;
        }
      }
    }
  }
  return false;
}