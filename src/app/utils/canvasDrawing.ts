import type { DialogueData, BubbleDimensions } from "@/app/types/manga";
import { CANVAS_DEFAULTS } from "@/app/types/manga";
import {
  wrapText,
  calculateTextHeight,
  calculateTextWidth,
} from "./textWrapping";

/**
 * Draws a speech bubble on the canvas
 */
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const padding = 20;
  const pointerBaseWidth = 20;
  const pointerHeight = 30;

  ctx.beginPath();
  ctx.moveTo(x + padding, y);
  ctx.lineTo(x + width - padding, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + padding);
  ctx.lineTo(x + width, y + height - padding);
  ctx.quadraticCurveTo(x + width, y + height, x + width - padding, y + height);

  // const pointerX = x + width / 2;
  // ctx.lineTo(pointerX + pointerBaseWidth / 2, y + height);
  // ctx.lineTo(pointerX, y + height + pointerHeight);
  // ctx.lineTo(pointerX - pointerBaseWidth / 2, y + height);

  ctx.lineTo(x + padding, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - padding);
  ctx.lineTo(x, y + padding);
  ctx.quadraticCurveTo(x, y, x + padding, y);
  ctx.closePath();

  ctx.fillStyle = CANVAS_DEFAULTS.BUBBLE_FILL;
  ctx.fill();
  ctx.strokeStyle = CANVAS_DEFAULTS.STROKE_COLOR;
  ctx.lineWidth = CANVAS_DEFAULTS.LINE_WIDTH;
  ctx.stroke();
}

/**
 * Draws a thought bubble on the canvas
 */
export function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  // Main bubble with rounded corners
  ctx.beginPath();
  ctx.moveTo(x + 15, y);
  ctx.lineTo(x + width - 15, y);
  ctx.arcTo(x + width, y, x + width, y + 15, 15);
  ctx.lineTo(x + width, y + height - 15);
  ctx.arcTo(x + width, y + height, x + width - 15, y + height, 15);
  ctx.lineTo(x + 15, y + height);
  ctx.arcTo(x, y + height, x, y + height - 15, 15);
  ctx.lineTo(x, y + 15);
  ctx.arcTo(x, y, x + 15, y, 15);
  ctx.closePath();

  ctx.fillStyle = CANVAS_DEFAULTS.BUBBLE_FILL;
  ctx.fill();
  ctx.strokeStyle = CANVAS_DEFAULTS.STROKE_COLOR;
  ctx.lineWidth = CANVAS_DEFAULTS.LINE_WIDTH;
  ctx.stroke();

  // Draw thought clouds
  ctx.beginPath();
  ctx.arc(x + width * 0.3, y + height + 20, 8, 0, Math.PI * 2);
  ctx.fillStyle = CANVAS_DEFAULTS.BUBBLE_FILL;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + width * 0.2, y + height + 40, 5, 0, Math.PI * 2);
  ctx.fillStyle = CANVAS_DEFAULTS.BUBBLE_FILL;
  ctx.fill();
  ctx.stroke();
}

/**
 * Draws a shout bubble (spiky) on the canvas
 */
export function drawShoutBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const spikes = 12;
  const outerRadius = Math.max(width, height) / 1.5;
  const innerRadius = Math.max(width, height) / 2.2;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - outerRadius);

  for (let i = 0; i < spikes; i++) {
    let currentX = centerX + Math.cos(rot) * outerRadius;
    let currentY = centerY + Math.sin(rot) * outerRadius;
    ctx.lineTo(currentX, currentY);
    rot += step;

    currentX = centerX + Math.cos(rot) * innerRadius;
    currentY = centerY + Math.sin(rot) * innerRadius;
    ctx.lineTo(currentX, currentY);
    rot += step;
  }

  ctx.lineTo(centerX, centerY - outerRadius);
  ctx.closePath();

  ctx.fillStyle = CANVAS_DEFAULTS.BUBBLE_FILL;
  ctx.fill();
  ctx.strokeStyle = CANVAS_DEFAULTS.STROKE_COLOR;
  ctx.lineWidth = CANVAS_DEFAULTS.LINE_WIDTH;
  ctx.stroke();
}

/**
 * Calculates bubble dimensions based on text content
 */
export function calculateBubbleDimensions(
  ctx: CanvasRenderingContext2D,
  dialogue: DialogueData,
): BubbleDimensions {
  const padding = CANVAS_DEFAULTS.BUBBLE_PADDING;
  const maxWidth = CANVAS_DEFAULTS.MAX_TEXT_WIDTH;
  const lineHeight = CANVAS_DEFAULTS.LINE_HEIGHT;

  // Set font for measurement
  ctx.font = CANVAS_DEFAULTS.FONT;

  const textHeight = calculateTextHeight(
    ctx,
    dialogue.dialogue,
    maxWidth,
    lineHeight,
  );
  const textWidth = calculateTextWidth(ctx, dialogue.dialogue, maxWidth);

  const bubbleWidth = Math.min(maxWidth, textWidth) + padding * 2;
  const bubbleHeight = textHeight + padding;

  const bubbleX = dialogue.position.x - bubbleWidth / 2;
  const bubbleY = dialogue.position.y - bubbleHeight / 2;

  return {
    width: bubbleWidth,
    height: bubbleHeight,
    x: bubbleX,
    y: bubbleY,
  };
}

/**
 * Renders a complete dialogue bubble with text
 */
export function renderDialogueBubble(
  ctx: CanvasRenderingContext2D,
  dialogue: DialogueData,
): void {
  const dimensions = calculateBubbleDimensions(ctx, dialogue);

  ctx.save();

  // Draw the appropriate bubble type
  switch (dialogue.type.toLowerCase()) {
    case "thought":
      drawThoughtBubble(
        ctx,
        dimensions.x,
        dimensions.y,
        dimensions.width,
        dimensions.height,
      );
      break;
    case "shout":
      drawShoutBubble(
        ctx,
        dimensions.x,
        dimensions.y,
        dimensions.width,
        dimensions.height,
      );
      break;
    default:
      drawSpeechBubble(
        ctx,
        dimensions.x,
        dimensions.y,
        dimensions.width,
        dimensions.height,
      );
  }

  // Draw the dialogue text
  ctx.fillStyle = CANVAS_DEFAULTS.FILL_COLOR;
  ctx.font = CANVAS_DEFAULTS.FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  wrapText(
    ctx,
    dialogue.dialogue,
    dialogue.position.x,
    dialogue.position.y -
      (dimensions.height -
        calculateTextHeight(
          ctx,
          dialogue.dialogue,
          CANVAS_DEFAULTS.MAX_TEXT_WIDTH,
          CANVAS_DEFAULTS.LINE_HEIGHT,
        )) /
        4,
    CANVAS_DEFAULTS.MAX_TEXT_WIDTH,
    CANVAS_DEFAULTS.LINE_HEIGHT,
  );

  ctx.restore();
}

/**
 * Clears the entire canvas
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Renders all dialogue bubbles on the canvas
 */
export function renderAllDialogues(
  ctx: CanvasRenderingContext2D,
  dialogues: DialogueData[],
  offsetX: number = 0,
  offsetY: number = 0,
): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  dialogues.forEach((dialogue) => {
    renderDialogueBubble(ctx, dialogue);
  });

  ctx.restore();
}
