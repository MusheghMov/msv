"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  TLEventInfo,
} from "tldraw";
import "tldraw/tldraw.css";
import { DialogueBubbleShapeUtil } from "./DialogueBubbleShapeUtil";
import { DialogueBubbleTool } from "./DialogueBubbleTool";
import { getAssetUrls } from "@tldraw/assets/selfHosted";
import {
  DialogueData,
  AIGenerationRequest,
  AIGenerationResponse,
} from "@/app/types/manga";
import { DialogueBubbleShape } from "./DialogueBubbleShapeUtil";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useMangaScript } from "@/app/hooks/useMangaScript";

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

// Base components that don't need state access
const baseComponents = {
  Toolbar: (props: any) => {
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
  KeyboardShortcutsDialog: (props: any) => {
    const tools = useTools();
    return (
      <DefaultKeyboardShortcutsDialog {...props}>
        <DefaultKeyboardShortcutsDialogContent />
        <TldrawUiMenuItem {...tools["dialogue-bubble-tool"]} />
      </DefaultKeyboardShortcutsDialog>
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
  const { dialogues, scriptText, updateScriptAfterPositionChange } =
    useMangaScript();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Function to generate background using AI
  const generateBackground = useCallback(
    async (userPrompt?: string) => {
      if (!dialogues || dialogues.length === 0) {
        setGenerationError("No dialogue data available for context");
        return;
      }

      setIsGeneratingBackground(true);
      setGenerationError(null);

      try {
        const requestData: AIGenerationRequest = {
          userPrompt: userPrompt || "",
          dialogueData: dialogues,
          scriptText: scriptText || "",
        };

        const response = await fetch("/api/generate-background", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: AIGenerationResponse = await response.json();

        if (result.success && result.imageUrl) {
          setBackgroundImageUrl(result.imageUrl);
          setGenerationError(null);
        } else {
          throw new Error(result.error || "Failed to generate background");
        }
      } catch (error) {
        console.error("Error generating background:", error);
        setGenerationError(
          error instanceof Error ? error.message : "Unknown error occurred",
        );
      } finally {
        setIsGeneratingBackground(false);
      }
    },
    [dialogues, scriptText],
  );

  // Handle shape changes and sync back to dialogue data AND script text
  const handleShapeChange = useCallback(
    (dialogueUUID: string, shape: TLShape) => {
      try {
        // Validate UUID format and ensure this is a dialogue bubble shape
        if (
          !dialogueUUID ||
          typeof dialogueUUID !== "string" ||
          shape.type !== "dialogue-bubble"
        ) {
          return;
        }

        // Cast to DialogueBubbleShape for type safety
        const dialogueShape = shape as DialogueBubbleShape;

        // Find the dialogue with this UUID and update it
        const dialogueIndex = dialogues.findIndex(
          (dialogue) => dialogue.id === dialogueUUID,
        );

        if (dialogueIndex === -1) {
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

        // Regenerate script text from updated dialogues
        try {
          updateScriptAfterPositionChange(updatedDialogues);
        } catch (scriptError) {
          console.error("Error regenerating script text:", scriptError);
        }
      } catch (error) {
        console.error("Error handling shape change:", error);
      }
    },
    [dialogues, scriptText, updateScriptAfterPositionChange],
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
          const shapeUUID = shape.meta.id as string;
          if (shapeUUID) {
            existingShapeMap.set(shapeUUID, shape);
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

          const dialogueUUID = dialogue.id;
          const existingShape = existingShapeMap.get(dialogueUUID);

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

            // Separate position changes from property changes
            const positionChanged =
              bubbleShape.x !== safePosition.x ||
              bubbleShape.y !== safePosition.y;
            const propertiesChanged =
              bubbleShape.props.text !== shapeProps.text ||
              bubbleShape.props.character !== shapeProps.character ||
              bubbleShape.props.dialogueType !== shapeProps.dialogueType;

            if (propertiesChanged) {
              try {
                editor.updateShape({
                  id: existingShape.id,
                  type: "dialogue-bubble",
                  props: shapeProps,
                  meta: { id: existingShape.meta.id },
                });
              } catch (error) {
                console.error(
                  "Error updating shape properties:",
                  error,
                  dialogue.id,
                );
              }
            } else if (positionChanged || propertiesChanged) {
              // Update both position and properties for non-recently modified shapes
              try {
                editor.updateShape({
                  id: existingShape.meta.id,
                  type: "dialogue-bubble",
                  x: safePosition.x,
                  y: safePosition.y,
                  props: shapeProps,
                  meta: { id: existingShape.meta.id },
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
                type: "dialogue-bubble" as const,
                x: safePosition.x,
                y: safePosition.y,
                props: shapeProps,
                meta: { id: dialogueUUID },
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
    [editor],
  );

  // const store = useSyncDemo({
  //   roomId: "msv-deom-room-1212341241212415123541234",
  //   shapeUtils: customShapeUtils,
  // });

  // Custom shape utilities - memoized to prevent re-renders
  const customShapeUtils = useMemo(() => [DialogueBubbleShapeUtil], []);

  // Components with state access
  const components: TLComponents = useMemo(
    () => ({
      ...baseComponents,
      // Visual canvas boundary indicator with background support
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
              backgroundImage: backgroundImageUrl
                ? `url(${backgroundImageUrl})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        );
      },
    }),
    [backgroundImageUrl],
  );

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

  useEffect(() => {
    if (!editor) {
      return;
    }
    updateDialogueShapes(dialogues, editor);
  }, [scriptText]);

  useEffect(() => {
    if (!editor) return;
    const func = (e: TLEventInfo) => {
      if (e.name !== "pointer_up") return;

      // get moved shape
      const shape = editor.getShapeAtPoint(editor.inputs.currentPagePoint);
      if (!shape) return;

      const dialogueUUID = shape.meta.id as string;

      // Cast shapes to DialogueBubbleShape for type safety
      const bubbleShape = shape as DialogueBubbleShape;

      // Update dialogue data based on shape changes
      handleShapeChange(dialogueUUID, bubbleShape);
    };

    editor.addListener("event", func);

    return () => {
      editor.removeListener("event", func);
    };
  }, [editor]);

  return (
    <Card
      className="p-0 overflow-hidden relative w-full h-full"
      style={{ minHeight: "600px" }}
    >
      {/* AI Background Generation Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          onClick={() => generateBackground()}
          disabled={
            isGeneratingBackground || !dialogues || dialogues.length === 0
          }
          className="shadow-lg"
          variant="default"
          size="sm"
        >
          {isGeneratingBackground ? "Generating..." : "🎨 Generate Background"}
        </Button>

        {backgroundImageUrl && (
          <Button
            onClick={() => setBackgroundImageUrl(null)}
            variant="outline"
            size="sm"
            className="shadow-lg"
          >
            🗑️ Clear Background
          </Button>
        )}

        {generationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs max-w-48">
            {generationError}
          </div>
        )}
      </div>

      <Tldraw
        // store={store}
        onMount={(editor) => {
          setEditor(editor);

          // Set up camera options
          editor.setCameraOptions(MANGA_CAMERA_OPTIONS);

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
        }}
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
