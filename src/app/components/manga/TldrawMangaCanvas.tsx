"use client";

import { useEffect, useCallback, useRef } from "react";
import { Tldraw, Editor, useEditor } from "tldraw";
import { useAtom, useSetAtom } from "jotai";
import "tldraw/tldraw.css";
import type { DialogueData } from "@/app/types/manga";
import { DialogueBubbleShapeUtil } from "./DialogueBubbleShapeUtil";
import { shapesToDialogues, formatDialogueToScript } from "@/app/utils/scriptParser";

// Import tldraw assets
import { getAssetUrls } from "@tldraw/assets/selfHosted";
import dialoguesAtom from "@/app/atoms/dialoguesAtom";
import scriptTextAtom from "@/app/atoms/scriptTextAtom";
import syncSourceAtom from "@/app/atoms/syncSourceAtom";

function TldrawContent({
  dialogues,
  backgroundUrl,
}: {
  dialogues: DialogueData[];
  backgroundUrl?: string;
}) {
  const editor = useEditor();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setDialogues = useSetAtom(dialoguesAtom);
  const setScriptText = useSetAtom(scriptTextAtom);
  const [syncSource, setSyncSource] = useAtom(syncSourceAtom);
  const shapeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert DialogueData to tldraw shapes with efficient updates
  const updateDialogueShapes = useCallback(() => {
    if (!editor) return;

    const allShapes = editor.getCurrentPageShapes();
    const existingDialogueShapes = allShapes.filter(
      (shape) => shape.type === "dialogue-bubble",
    );

    // Create a map of existing shapes by their index
    const existingShapeMap = new Map();
    existingDialogueShapes.forEach((shape) => {
      const match = shape.id.match(/dialogue_(\d+)$/);
      if (match) {
        existingShapeMap.set(parseInt(match[1]), shape);
      }
    });

    // Update existing shapes and create new ones
    dialogues.forEach((dialogue, index) => {
      const shapeId = `shape:dialogue_${index}`;
      const existingShape = existingShapeMap.get(index);

      const shapeProps = {
        w: 200,
        h: 100,
        text: dialogue.dialogue,
        character: dialogue.character,
        dialogueType: dialogue.type,
      };

      if (existingShape) {
        // Update existing shape if properties changed
        const needsUpdate =
          existingShape.x !== dialogue.position.x ||
          existingShape.y !== dialogue.position.y ||
          existingShape.props.text !== dialogue.dialogue ||
          existingShape.props.character !== dialogue.character ||
          existingShape.props.dialogueType !== dialogue.type;

        if (needsUpdate) {
          editor.updateShape({
            id: existingShape.id,
            type: "dialogue-bubble",
            x: dialogue.position.x,
            y: dialogue.position.y,
            props: shapeProps,
          });
        }
        // Mark as processed
        existingShapeMap.delete(index);
      } else {
        // Create new shape
        editor.createShape({
          id: shapeId as any,
          type: "dialogue-bubble" as const,
          x: dialogue.position.x,
          y: dialogue.position.y,
          props: shapeProps,
        });
      }
    });

    // Remove shapes that no longer have corresponding dialogues
    const shapesToRemove = Array.from(existingShapeMap.values());
    if (shapesToRemove.length > 0) {
      editor.deleteShapes(shapesToRemove.map((shape) => shape.id));
    }
  }, [editor, dialogues]);

  // Set background image (simplified original approach)
  const setBackground = useCallback(() => {
    if (!editor || !backgroundUrl) return;

    // Find and remove existing background image
    const allShapes = editor.getCurrentPageShapes();
    const existingBg = allShapes.find(
      (shape) =>
        shape.type === "image" && shape.id === "shape:background_image",
    );

    if (existingBg) {
      editor.deleteShape(existingBg.id);
    }

    // Create background image shape positioned behind other elements
    // Position it at the center of the current viewport
    const viewportBounds = editor.getViewportPageBounds();
    const centerX = viewportBounds.x + viewportBounds.w / 2;
    const centerY = viewportBounds.y + viewportBounds.h / 2;

    editor.createShape({
      id: "shape:background_image" as any,
      type: "image" as const,
      x: centerX - 400, // Center the 800px wide image
      y: centerY - 300, // Center the 600px tall image
      props: {
        url: backgroundUrl,
        w: 800,
        h: 600,
      },
    });

    // Send the background image to the back so dialogue bubbles appear on top
    editor.sendToBack(["shape:background_image" as any]);
  }, [editor, backgroundUrl]);

  // Update shapes when dialogues change (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout to debounce updates
    updateTimeoutRef.current = setTimeout(() => {
      updateDialogueShapes();
    }, 300); // 300ms delay

    // Cleanup on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateDialogueShapes]);

  // Update background when backgroundUrl changes
  useEffect(() => {
    if (backgroundUrl) {
      setBackground();
    }
  }, [setBackground, backgroundUrl]);

  // Listen for shape changes to sync bubbles → text
  useEffect(() => {
    if (!editor) return;

    const handleShapeChanges = () => {
      // Only process changes if sync source is not already 'text' (to prevent loops)
      if (syncSource === 'text') return;

      // Clear existing timeout
      if (shapeChangeTimeoutRef.current) {
        clearTimeout(shapeChangeTimeoutRef.current);
      }

      // Debounce the update
      shapeChangeTimeoutRef.current = setTimeout(() => {
        const allShapes = editor.getCurrentPageShapes();
        const dialogueShapes = allShapes.filter(shape => shape.type === 'dialogue-bubble');
        
        // Convert shapes back to DialogueData
        const updatedDialogues = shapesToDialogues(dialogueShapes);
        
        if (updatedDialogues.length > 0) {
          // Set sync source to 'bubbles' to prevent text→bubble sync
          setSyncSource('bubbles');
          
          // Update dialogues and script text
          setDialogues(updatedDialogues);
          const newScriptText = formatDialogueToScript(updatedDialogues);
          setScriptText(newScriptText);
          
          // Reset sync source after a delay
          setTimeout(() => setSyncSource('none'), 100);
        }
      }, 300);
    };

    // Listen to store changes
    const unsubscribe = editor.store.listen(
      (entry) => {
        // Check if any dialogue bubble shapes were modified
        const isUserChange = entry.source === 'user';
        
        if (isUserChange) {
          // Check if any changes involve dialogue shapes
          const hasDialogueChanges = Object.values(entry.changes.added).some((record: any) => 
            record.id && record.id.startsWith('shape:dialogue_')
          ) || Object.values(entry.changes.updated).some(([_prev, record]: any) => 
            record.id && record.id.startsWith('shape:dialogue_')
          ) || Object.values(entry.changes.removed).some((record: any) =>
            record.id && record.id.startsWith('shape:dialogue_')
          );
          
          if (hasDialogueChanges) {
            handleShapeChanges();
          }
        }
      },
      { source: 'user', scope: 'document' }
    );

    return () => {
      unsubscribe();
      if (shapeChangeTimeoutRef.current) {
        clearTimeout(shapeChangeTimeoutRef.current);
      }
    };
  }, [editor, syncSource, setSyncSource, setDialogues, setScriptText]);

  return null; // This component doesn't render anything itself
}

export function TldrawMangaCanvas() {
  const [dialogues] = useAtom(dialoguesAtom);
  const handleMount = (editor: Editor) => {
    // Initial setup when tldraw mounts
  };

  // Custom shape utilities
  const customShapeUtils = [DialogueBubbleShapeUtil];

  // Get asset URLs for proper icon loading (use local assets)
  const assetUrls = getAssetUrls({
    baseUrl: "/",
  });

  return (
    <div className="relative w-full h-full" style={{ minHeight: "600px" }}>
      <Tldraw
        onMount={handleMount}
        shapeUtils={customShapeUtils}
        assetUrls={assetUrls}
        autoFocus={false}
      >
        <TldrawContent dialogues={dialogues} />
      </Tldraw>
    </div>
  );
}
