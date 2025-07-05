import { HTMLContainer, Rectangle2d, ShapeUtil, TLBaseShape } from "tldraw";
import type { DialogueType } from "@/app/types/manga";

// Define the shape type
export type DialogueBubbleShape = TLBaseShape<
  "dialogue-bubble",
  {
    w: number;
    h: number; // Added height prop to store calculated height
    text: string;
    character: string;
    dialogueType: DialogueType;
  }
>;

export class DialogueBubbleShapeUtil extends ShapeUtil<DialogueBubbleShape> {
  static override type = "dialogue-bubble" as const;

  getDefaultProps(): DialogueBubbleShape["props"] {
    return {
      w: 200,
      h: 100, // Initial height
      text: "Hello!",
      character: "Character",
      dialogueType: "speech",
    };
  }

  // Calculate height based on text content
  private calculateHeight(shape: DialogueBubbleShape): number {
    const { text, character, w } = shape.props;

    // Create temporary element to measure text height
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.width = `${w - 20}px`; // Account for padding
    tempDiv.style.fontSize = "14px";
    tempDiv.style.fontFamily = "Comic Sans MS, cursive";
    tempDiv.style.lineHeight = "1.2";
    tempDiv.style.padding = "10px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.textTransform = "uppercase";
    tempDiv.style.textAlign = "center";

    // Add character name
    const characterDiv = document.createElement("div");
    characterDiv.style.fontWeight = "bold";
    characterDiv.style.fontSize = "12px";
    characterDiv.style.marginBottom = "4px";
    characterDiv.textContent = `${character}:`;
    tempDiv.appendChild(characterDiv);

    // Add text content
    const textDiv = document.createElement("div");
    textDiv.textContent = text;
    tempDiv.appendChild(textDiv);

    document.body.appendChild(tempDiv);
    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    // Add some padding and minimum height
    return Math.max(80, height + 20);
  }

  // Update shape height when needed
  private updateHeightIfNeeded(shape: DialogueBubbleShape) {
    const calculatedHeight = this.calculateHeight(shape);
    if (Math.abs(calculatedHeight - shape.props.h) > 2) {
      this.editor.updateShape<DialogueBubbleShape>({
        id: shape.id,
        type: "dialogue-bubble",
        props: {
          ...shape.props,
          h: calculatedHeight,
        },
      });
    }
  }

  getGeometry(shape: DialogueBubbleShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h, // Now uses the calculated height
      isFilled: true,
    });
  }

  // Handle updates to recalculate height when text or width changes
  override onBeforeUpdate(
    prev: DialogueBubbleShape,
    next: DialogueBubbleShape,
  ) {
    if (
      prev.props.text !== next.props.text ||
      prev.props.character !== next.props.character ||
      prev.props.w !== next.props.w
    ) {
      const newHeight = this.calculateHeight(next);
      return {
        ...next,
        props: {
          ...next.props,
          h: newHeight,
        },
      };
    }
    return next;
  }

  // Handle resize - proper implementation for all resize handles with both width and height
  override onResize(shape: DialogueBubbleShape, info: any) {
    const { scaleX, scaleY, handle } = info;
    
    // Calculate new dimensions based on both scales
    const newWidth = Math.max(100, shape.props.w * scaleX);
    const newHeight = Math.max(50, shape.props.h * scaleY);
    
    // Handle position updates for different resize handles
    let newX = shape.x;
    let newY = shape.y;
    
    // For left-side resizes, adjust X position to keep right edge fixed
    if (handle && (handle.includes('left') || handle.includes('w'))) {
      newX = shape.x + shape.props.w - newWidth;
    }
    
    // For top-side resizes, adjust Y position to keep bottom edge fixed
    if (handle && (handle.includes('top') || handle.includes('n'))) {
      newY = shape.y + shape.props.h - newHeight;
    }

    return {
      x: newX,
      y: newY,
      props: {
        w: newWidth,
        h: newHeight,
      },
    };
  }

  // Hide all resize handles since we want automatic height
  override hideResizeHandles = (_shape: DialogueBubbleShape) => false;

  // Override canResize to control resize behavior
  override canResize = (_shape: DialogueBubbleShape) => true;

  component(shape: DialogueBubbleShape) {
    const { w, h, text, character, dialogueType } = shape.props;

    // Update height when component renders (for text changes)
    setTimeout(() => this.updateHeightIfNeeded(shape), 0);

    // Simple color scheme
    const bubbleColor = "#ffffff";
    const textColor = "#000000";
    const borderColor = "#333333";

    // Different bubble styles based on dialogue type
    const getBubbleStyle = () => {
      const baseStyle = {
        width: w,
        height: h, // Use calculated height
        backgroundColor: bubbleColor,
        border: `2px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "center",
        alignItems: "center",
        padding: "10px",
        fontSize: "14px",
        fontFamily: "Comic Sans MS, cursive",
        color: textColor,
        position: "relative" as const,
        boxSizing: "border-box" as const,
        textTransform: "uppercase" as const,
      };

      switch (dialogueType) {
        case "speech":
          return {
            ...baseStyle,
            borderRadius: "20px",
          };
        case "thought":
          return {
            ...baseStyle,
            borderRadius: "50%",
            borderStyle: "dashed",
          };
        case "shout":
          return {
            ...baseStyle,
            borderRadius: "5px",
            borderWidth: "3px",
            fontWeight: "bold",
            textTransform: "uppercase" as const,
          };
        case "whisper":
          return {
            ...baseStyle,
            borderRadius: "20px",
            borderStyle: "dotted",
            fontSize: "12px",
            fontStyle: "italic",
            opacity: 0.8,
          };
        case "narrator":
          return {
            ...baseStyle,
            borderRadius: "0px",
            backgroundColor: "#f0f0f0",
            borderColor: "#666666",
            fontSize: "13px",
            fontFamily: "Arial, sans-serif",
            fontStyle: "italic",
          };
        default:
          return baseStyle;
      }
    };

    const wrapText = (text: string, maxWidth: number) => {
      // Calculate approximate character width for wrapping
      const avgCharWidth = 8; // Approximate width in pixels for Comic Sans MS 14px
      const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        if (
          (currentLine + (currentLine ? " " : "") + word).length <=
          maxCharsPerLine
        ) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const availableWidth = w - 20; // Account for padding
    const textLines = wrapText(text, availableWidth);

    return (
      <HTMLContainer>
        <div style={getBubbleStyle()}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              marginBottom: "4px",
              color: "#666666",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const newCharacter = e.currentTarget.textContent || "";
              this.editor.updateShape<DialogueBubbleShape>({
                id: shape.id,
                type: "dialogue-bubble",
                props: {
                  ...shape.props,
                  character: newCharacter,
                },
              });
            }}
          >
            {character}:
          </div>
          <div
            style={{
              textAlign: "center",
              lineHeight: "1.2",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              width: "100%",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const newText = e.currentTarget.textContent || "";
              this.editor.updateShape<DialogueBubbleShape>({
                id: shape.id,
                type: "dialogue-bubble",
                props: {
                  ...shape.props,
                  text: newText,
                },
              });
            }}
          >
            {textLines.map((line, index) => (
              <div
                key={index}
                style={{ width: "100%", wordBreak: "break-word" }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: DialogueBubbleShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h} // Use calculated height for indicator
        stroke="blue"
        strokeWidth="2"
        fill="none"
      />
    );
  }
}
