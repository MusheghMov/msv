"use client";

import { useSyncDemo } from "@tldraw/sync";
import { useCallback, useMemo, useState } from "react";
import {
  Tldraw,
  Editor,
  TLUiOverrides,
  TldrawProps,
  TLComponents,
  TLUiAssetUrlOverrides,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuItem,
  useIsToolSelected,
  useTools,
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  TLCameraOptions,
  TLShape,
  Box,
} from "tldraw";
import "tldraw/tldraw.css";
import { useAtom } from "jotai";
import { DialogueBubbleShapeUtil } from "./DialogueBubbleShapeUtil";
import { DialogueBubbleTool } from "./DialogueBubbleTool";

// Import tldraw assets
import { getAssetUrls } from "@tldraw/assets/selfHosted";
import dialoguesAtom, { useDialoguesListener } from "@/app/atoms/dialoguesAtom";
import { DialogueData } from "@/app/types/manga";
import { DialogueBubbleShape } from "./DialogueBubbleShapeUtil";
import { Card } from "../ui/card";

// Define canvas constants
const CANVAS_WIDTH = 935; // You can adjust this based on your needs
const CANVAS_HEIGHT = 1305; // You can adjust this based on your needs
const CANVAS_PADDING = 100; // Padding for camera constraints
// Camera options with fixed bounds
const MANGA_CAMERA_OPTIONS: TLCameraOptions = {
  isLocked: false,
  wheelBehavior: "pan",
  panSpeed: 1,
  zoomSpeed: 1,
  zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4, 8],
  constraints: {
    bounds: {
      x: 0,
      y: 0,
      w: CANVAS_WIDTH,
      h: CANVAS_HEIGHT,
    },
    behavior: {
      x: "contain", // Camera will be contained within bounds
      y: "contain",
    },
    padding: {
      x: CANVAS_PADDING,
      y: CANVAS_PADDING,
    },
    origin: { x: 0.5, y: 0.5 },
    initialZoom: "fit-max",
    baseZoom: "default",
  },
};

export function constrainToArtboard(
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH, x)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, y)),
  };
}

// Utility function to constrain shapes within canvas bounds
function constrainShapeToCanvas(shape: TLShape): TLShape {
  // Skip if shape is not at the page level
  if (shape.parentId !== "page:page") return shape;

  // Get shape bounds (approximate - you might need to adjust based on shape type)
  const padding = 10; // Prevent shapes from touching the exact edge
  const minX = padding;
  const minY = padding;
  const maxX = CANVAS_WIDTH - padding;
  const maxY = CANVAS_HEIGHT - padding;

  // Constrain position
  let { x, y } = shape;

  // For shapes with width/height props
  if (
    "props" in shape &&
    shape.props &&
    "w" in shape.props &&
    "h" in shape.props
  ) {
    const w = (shape.props.w as number) || 200;
    const h = (shape.props.h as number) || 100;

    // Prevent shape from going outside right/bottom bounds
    x = Math.min(x, maxX - w);
    y = Math.min(y, maxY - h);
  }

  // Prevent shape from going outside left/top bounds
  x = Math.max(x, minX);
  y = Math.max(y, minY);

  // Return shape with constrained position
  if (x !== shape.x || y !== shape.y) {
    return {
      ...shape,
      x,
      y,
    };
  }

  return shape;
}

// Custom tools array
const customTools = [DialogueBubbleTool];

// UI overrides
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools["dialogue-bubble-tool"] = {
      id: "dialogue-bubble-tool",
      icon: "dialogue-bubble-icon",
      label: "Dialogue Bubble",
      kbd: "d",
      onSelect: () => {
        editor.setCurrentTool("dialogue-bubble-tool");
      },
    };
    return tools;
  },
};

// Custom Components
const components: TLComponents = {
  Toolbar: (props) => {
    const tools = useTools();
    const isDialogueBubbleSelected = useIsToolSelected(
      tools["dialogue-bubble-tool"],
    );
    return (
      <DefaultToolbar {...props}>
        <TldrawUiMenuItem
          {...tools["dialogue-bubble-tool"]}
          isSelected={isDialogueBubbleSelected}
        />
        <DefaultToolbarContent />
      </DefaultToolbar>
    );
  },
  KeyboardShortcutsDialog: (props) => {
    const tools = useTools();
    return (
      <DefaultKeyboardShortcutsDialog {...props}>
        <DefaultKeyboardShortcutsDialogContent />
        <TldrawUiMenuItem {...tools["dialogue-bubble-tool"]} />
      </DefaultKeyboardShortcutsDialog>
    );
  },
  // Visual canvas boundary indicator
  OnTheCanvas: () => {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          pointerEvents: "none",
          backgroundColor: "white",
        }}
      />
    );
  },
};

// Custom Asset URLs
const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "dialogue-bubble-icon":
      "https://unpkg.com/lucide-static@latest/icons/message-square-quote.svg",
  },
};

export function TldrawMangaCanvas() {
  const [dialogues, setDialogues] = useAtom(dialoguesAtom);
  useDialoguesListener((_get, _set, newVal, prevVal) => {
    if (!editor) return;
    updateDialogueShapes(newVal, editor);
  });

  const [editor, setEditor] = useState<Editor | null>(null);

  // Handle shape changes and sync back to dialogue data
  const handleShapeChange = useCallback(
    (dialogueUUID: string, shape: TLShape) => {
      try {
        // Validate UUID format
        if (!dialogueUUID || typeof dialogueUUID !== "string") {
          console.warn("Invalid dialogue UUID:", dialogueUUID);
          return;
        }

        // Ensure this is a dialogue bubble shape
        if (shape.type !== "dialogue-bubble") {
          console.warn("Shape is not a dialogue bubble:", shape.type);
          return;
        }

        // Cast to DialogueBubbleShape for type safety
        const dialogueShape = shape as DialogueBubbleShape;

        // Find the dialogue with this UUID and update it
        const dialogueIndex = dialogues.findIndex(
          (dialogue) => dialogue.id === dialogueUUID,
        );

        if (dialogueIndex === -1) {
          console.warn("No dialogue found for UUID:", dialogueUUID);
          // Handle orphaned shape - could remove it or ignore
          return;
        }

        const updatedDialogues = dialogues.map((dialogue) => {
          if (dialogue.id === dialogueUUID) {
            return {
              ...dialogue,
              position: {
                x: Math.max(
                  0,
                  Math.min(CANVAS_WIDTH, Math.round(dialogueShape.x)),
                ),
                y: Math.max(
                  0,
                  Math.min(CANVAS_HEIGHT, Math.round(dialogueShape.y)),
                ),
              },
              // Update text content if it changed, with fallbacks
              dialogue: dialogueShape.props?.text || dialogue.dialogue || "",
              character:
                dialogueShape.props?.character ||
                dialogue.character ||
                "Unknown",
              type:
                dialogueShape.props?.dialogueType || dialogue.type || "speech",
            };
          }
          return dialogue;
        });

        setDialogues(updatedDialogues);
      } catch (error) {
        console.error("Error handling shape change:", error);
      }
    },
    [dialogues, setDialogues],
  );

  const handleMount = (editor: Editor) => {
    setEditor(editor);

    // Set up camera options
    editor.setCameraOptions(MANGA_CAMERA_OPTIONS);

    // Register shape constraints to keep shapes within canvas bounds
    editor.sideEffects.registerBeforeCreateHandler("shape", (shape) => {
      return constrainShapeToCanvas(shape);
    });

    editor.sideEffects.registerBeforeChangeHandler(
      "shape",
      (_prevShape, nextShape) => {
        return constrainShapeToCanvas(nextShape);
      },
    );

    // Register handler for shape changes to sync back to dialogues
    editor.sideEffects.registerAfterChangeHandler(
      "shape",
      (prevShape, nextShape) => {
        // Only handle dialogue-bubble shapes
        if (nextShape.type !== "dialogue-bubble") return;

        // Extract dialogue UUID from shape ID
        const match = nextShape.id.match(/^shape:(.+)$/);
        if (!match) return;

        const dialogueUUID = match[1];

        // Cast shapes to DialogueBubbleShape for type safety
        const prevBubbleShape = prevShape as DialogueBubbleShape;
        const nextBubbleShape = nextShape as DialogueBubbleShape;

        // Check if position or content changed
        const positionChanged =
          prevBubbleShape.x !== nextBubbleShape.x ||
          prevBubbleShape.y !== nextBubbleShape.y;
        const contentChanged =
          prevBubbleShape.props?.text !== nextBubbleShape.props?.text ||
          prevBubbleShape.props?.character !==
            nextBubbleShape.props?.character ||
          prevBubbleShape.props?.dialogueType !==
            nextBubbleShape.props?.dialogueType;

        if (positionChanged || contentChanged) {
          // Update dialogue data based on shape changes
          handleShapeChange(dialogueUUID, nextBubbleShape);
        }
      },
    );

    // Set initial camera position to show the canvas
    editor.setCamera(
      {
        x: 0,
        y: 0,
        z: 1,
      },
      {
        immediate: true,
      },
    );

    // Zoom to fit the canvas
    editor.zoomToBounds(new Box(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT), {
      inset: 50,
    });

    updateDialogueShapes(dialogues, editor);
  };

  // Custom shape utilities - memoized to prevent re-renders
  const customShapeUtils = useMemo(() => [DialogueBubbleShapeUtil], []);

  // Merge default asset URLs with custom ones
  const defaultAssetUrls = getAssetUrls({
    baseUrl: "/",
  });

  const assetUrls: TldrawProps["assetUrls"] = useMemo(
    () => ({
      ...defaultAssetUrls,
      ...customAssetUrls,
    }),
    [customAssetUrls],
  );

  // Convert DialogueData to tldraw shapes with UUID-based efficient updates
  const updateDialogueShapes = useCallback(
    (dialogues: DialogueData[], editor: Editor) => {
      if (!editor) return;

      try {
        const allShapes = editor.getCurrentPageShapes();
        const existingDialogueShapes = allShapes.filter(
          (shape) => shape.type === "dialogue-bubble",
        );

        // Create a map of existing shapes by their UUID (extracted from shape ID)
        const existingShapeMap = new Map();
        existingDialogueShapes.forEach((shape) => {
          // Extract UUID from shape ID format: "shape:uuid"
          const match = shape.id.match(/^shape:(.+)$/);
          if (match) {
            const uuid = match[1];
            existingShapeMap.set(uuid, shape);
          } else {
            console.warn("Shape with invalid ID format:", shape.id);
          }
        });

        // Update existing shapes and create new ones based on UUIDs
        dialogues.forEach((dialogue) => {
          // Validate dialogue has required fields
          if (!dialogue.id) {
            console.warn("Dialogue missing UUID:", dialogue);
            return;
          }

          const shapeId = `shape:${dialogue.id}`;
          const existingShape = existingShapeMap.get(dialogue.id);

          const shapeProps = {
            w: 200,
            text: dialogue.dialogue || "",
            character: dialogue.character || "Unknown",
            dialogueType: dialogue.type || "speech",
          };

          // Ensure position is valid
          const safePosition = {
            x: Math.max(0, Math.min(1024, dialogue.position?.x || 100)),
            y: Math.max(0, Math.min(1024, dialogue.position?.y || 100)),
          };

          if (existingShape) {
            // Cast to DialogueBubbleShape for type safety
            const bubbleShape = existingShape as DialogueBubbleShape;

            // Update existing shape if properties changed
            const needsUpdate =
              bubbleShape.x !== safePosition.x ||
              bubbleShape.y !== safePosition.y ||
              bubbleShape.props.text !== shapeProps.text ||
              bubbleShape.props.character !== shapeProps.character ||
              bubbleShape.props.dialogueType !== shapeProps.dialogueType;

            if (needsUpdate) {
              try {
                editor.updateShape({
                  id: existingShape.id,
                  type: "dialogue-bubble",
                  x: safePosition.x,
                  y: safePosition.y,
                  props: shapeProps,
                });
              } catch (error) {
                console.error("Error updating shape:", error, dialogue.id);
              }
            }
            // Mark as processed
            existingShapeMap.delete(dialogue.id);
          } else {
            // Create new shape with UUID-based ID
            try {
              editor.createShape({
                id: shapeId as any,
                type: "dialogue-bubble" as const,
                x: safePosition.x,
                y: safePosition.y,
                props: shapeProps,
              });
            } catch (error) {
              console.error("Error creating shape:", error, dialogue.id);
            }
          }
        });

        // Remove shapes that no longer have corresponding dialogues
        const shapesToRemove = Array.from(existingShapeMap.values());
        if (shapesToRemove.length > 0) {
          try {
            editor.deleteShapes(shapesToRemove.map((shape) => shape.id));
          } catch (error) {
            console.error("Error removing orphaned shapes:", error);
          }
        }
      } catch (error) {
        console.error("Error in updateDialogueShapes:", error);
      }
    },
    [dialogues, editor],
  );
  const store = useSyncDemo({
    roomId: "msv-deom-room-1212341241212415123541234",
    shapeUtils: customShapeUtils,
  });

  return (
    <Card
      className="p-0 overflow-hidden relative w-full h-full"
      style={{ minHeight: "600px" }}
    >
      <Tldraw
        // store={store}
        onMount={handleMount}
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={uiOverrides}
        components={components}
        assetUrls={assetUrls}
        cameraOptions={MANGA_CAMERA_OPTIONS}
        autoFocus={false}
      />
    </Card>
  );
}
