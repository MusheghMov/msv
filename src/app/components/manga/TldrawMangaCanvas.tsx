"use client";

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
import { useAtom, useSetAtom } from "jotai";
import { DialogueBubbleShapeUtil } from "./DialogueBubbleShapeUtil";
import { DialogueBubbleTool } from "./DialogueBubbleTool";

// Import tldraw assets
import { getAssetUrls } from "@tldraw/assets/selfHosted";
import dialoguesAtom, { useDialoguesListener } from "@/app/atoms/dialoguesAtom";
import scriptTextAtom from "@/app/atoms/scriptTextAtom";
import syncSourceAtom from "@/app/atoms/syncSourceAtom";
import { DialogueData } from "@/app/types/manga";

// Define canvas constants
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024; // You can adjust this based on your needs
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
  const [editor, setEditor] = useState<Editor | null>(null);

  useDialoguesListener((_get, _set, newVal, prevVal) => {
    console.log("Dialogues changed from:", prevVal, "to:", newVal);

    if (!editor) return;
    updateDialogueShapes(newVal, editor);
  });

  const handleMount = (editor: Editor) => {
    if (!editor) {
      setEditor(editor);
    }
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

  // Custom shape utilities
  const customShapeUtils = [DialogueBubbleShapeUtil];

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

  // Convert DialogueData to tldraw shapes with efficient updates
  const updateDialogueShapes = useCallback(
    (dialogues: DialogueData[], editor: Editor) => {
      console.log("updateDialogueShapes", dialogues, editor);
      if (!editor) return;

      const allShapes = editor.getCurrentPageShapes();
      console.log("allShapes", allShapes);
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
    },
    [dialogues, editor],
  );

  return (
    <div className="relative w-full h-full" style={{ minHeight: "600px" }}>
      <Tldraw
        onMount={handleMount}
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={uiOverrides}
        components={components}
        assetUrls={assetUrls}
        cameraOptions={MANGA_CAMERA_OPTIONS}
        autoFocus={false}
      />
    </div>
  );
}
