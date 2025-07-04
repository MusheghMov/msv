/**
 * Wraps text to fit within a specified width on a canvas
 */
export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  context.fillText(line, x, currentY);
}

/**
 * Calculates the total height needed for wrapped text
 */
export function calculateTextHeight(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let height = lineHeight; // Start with one line height

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      height += lineHeight;
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }

  return height;
}

/**
 * Calculates the maximum width needed for text (up to maxWidth)
 */
export function calculateTextWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): number {
  const words = text.split(' ');
  let line = '';
  let maxLineWidth = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      // Current line is complete, measure it
      const lineMetrics = context.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, lineMetrics.width);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }

  // Measure the last line
  if (line.trim()) {
    const lineMetrics = context.measureText(line);
    maxLineWidth = Math.max(maxLineWidth, lineMetrics.width);
  }

  return Math.min(maxLineWidth, maxWidth);
}