import { useRef, useCallback, useEffect } from "react";
import type { DialogueData } from "@/app/types/manga";
import { clearCanvas, renderAllDialogues } from "@/app/utils/canvasDrawing";

/**
 * Custom hook for managing canvas rendering operations
 */
export function useCanvasRenderer(): {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  renderDialogues: (
    dialogues: DialogueData[],
    offsetX?: number,
    offsetY?: number,
  ) => void;
  clearCanvasArea: () => void;
  getContext: () => CanvasRenderingContext2D | null;
} {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return canvas.getContext("2d");
  }, []);

  const clearCanvasArea = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    clearCanvas(ctx, canvas.width, canvas.height);
  }, [getContext]);

  const renderDialogues = useCallback(
    (dialogues: DialogueData[], offsetX: number = 0, offsetY: number = 0) => {
      const ctx = getContext();

      if (!ctx) return;

      clearCanvasArea();
      renderAllDialogues(ctx, dialogues, offsetX, offsetY);
    },
    [getContext, clearCanvasArea],
  );

  // Resize canvas to match container size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const { clientWidth, clientHeight } = container;

    // Only resize if dimensions actually changed
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }
  }, []);

  // Set up resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial resize
    resizeCanvas();

    // Set up resize observer for responsive behavior
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    // Also listen to window resize as fallback
    window.addEventListener("resize", resizeCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  return {
    canvasRef,
    renderDialogues,
    clearCanvasArea,
    getContext,
  };
}

