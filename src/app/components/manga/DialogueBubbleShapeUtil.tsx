import { HTMLContainer, Rectangle2d, ShapeUtil, TLBaseShape } from "tldraw";
import type { DialogueType } from "@/app/types/manga";

// Define the shape type
export type DialogueBubbleShape = TLBaseShape<
  "dialogue-bubble",
  {
    w: number;
    h: number;
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
      h: 100,
      text: "Hello!",
      character: "Character",
      dialogueType: "speech",
    };
  }

  getGeometry(shape: DialogueBubbleShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: DialogueBubbleShape) {
    const { w, h, text, character, dialogueType } = shape.props;

    // Simple color scheme
    const bubbleColor = "#ffffff";
    const textColor = "#000000";
    const borderColor = "#333333";

    // Different bubble styles based on dialogue type
    const getBubbleStyle = () => {
      const baseStyle = {
        width: w,
        height: h,
        backgroundColor: bubbleColor,
        border: `2px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "center",
        alignItems: "center",
        padding: "8px",
        fontSize: "14px",
        fontFamily: "Comic Sans MS, cursive",
        color: textColor,
        position: "relative" as const,
        boxSizing: "border-box" as const,
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
            // Jagged edges effect
            clipPath:
              "polygon(0% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%, 0% 5%)",
          };
        default:
          return baseStyle;
      }
    };

    const wrapText = (text: string, maxLineLength: number = 20) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        if ((currentLine + word).length <= maxLineLength) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const textLines = wrapText(text);

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
          >
            {character}:
          </div>
          <div style={{ textAlign: "center", lineHeight: "1.2" }}>
            {textLines.map((line, index) => (
              <div key={index}>{line}</div>
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
        height={shape.props.h}
        stroke="blue"
        strokeWidth="2"
        fill="none"
      />
    );
  }
}

