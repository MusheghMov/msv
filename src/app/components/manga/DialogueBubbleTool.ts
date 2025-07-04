import { StateNode, TLKeyboardEventInfo, TLPointerEventInfo } from "tldraw";
import type { DialogueBubbleShape } from "./DialogueBubbleShapeUtil";
import { constrainToArtboard } from "@/app/utils/mangaCanvas";

export class DialogueBubbleTool extends StateNode {
  static override id = "dialogue-bubble-tool" as const;

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onExit() {
    this.editor.setCursor({ type: "default", rotation: 0 });
  }

  override onPointerDown(info: TLPointerEventInfo) {
    if (info.target === "canvas") {
      this.createDialogueBubble(info);
    }
  }

  private createDialogueBubble(info: TLPointerEventInfo) {
    const { x, y } = this.editor.screenToPage(info.point);

    // Constrain bubble placement to artboard bounds
    const bubbleWidth = 200;
    const bubbleHeight = 100;
    const constrainedPos = constrainToArtboard(
      x - bubbleWidth / 2, // Center the bubble on cursor
      y - bubbleHeight / 2
    );

    // Find the next available dialogue index
    const allShapes = this.editor.getCurrentPageShapes();
    const existingDialogueShapes = allShapes.filter(
      (shape) => shape.type === "dialogue-bubble",
    );

    // Extract indices from existing shapes
    const existingIndices = existingDialogueShapes
      .map((shape) => {
        const match = shape.id.match(/dialogue_(\d+)$/);
        return match ? parseInt(match[1]) : -1;
      })
      .filter((index) => index >= 0);

    // Find the next available index
    const nextIndex =
      existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 0;

    const shapeId = `shape:dialogue_${nextIndex}`;

    // Create the dialogue bubble shape with default properties
    this.editor.createShape({
      id: shapeId as any,
      type: "dialogue-bubble" as const,
      x: constrainedPos.x,
      y: constrainedPos.y,
      props: {
        w: bubbleWidth,
        h: bubbleHeight,
        text: "Hello!",
        character: "Character",
        dialogueType: "speech",
      },
    });

    // Select the newly created shape
    this.editor.select(shapeId as any);

    // Return to select tool after creating the shape
    this.editor.setCurrentTool("select");
  }

  override onCancel() {
    this.editor.setCurrentTool("select");
  }

  override onKeyDown(info: TLKeyboardEventInfo) {
    if (info.key === "Escape") {
      this.editor.setCurrentTool("select");
    }
  }
}

