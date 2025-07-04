"use client";

import { useEffect } from "react";
import { useCanvasRenderer } from "@/app/hooks/useCanvasRenderer";
import type { DialogueData } from "@/app/types/manga";

export function MangaCanvas({
  dialogues,
  offsetX,
  offsetY,
  backgroundUrl,
  onCanvasReady,
}: {
  dialogues: DialogueData[];
  offsetX: number;
  offsetY: number;
  backgroundUrl?: string;
  onCanvasReady?: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => void;
}) {
  const { canvasRef, renderDialogues, getContext } = useCanvasRenderer();

  // Re-render when dialogues or offsets change
  useEffect(() => {
    renderDialogues(dialogues, offsetX, offsetY);
  }, [dialogues, offsetX, offsetY, renderDialogues]);

  // Notify parent when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (canvas && ctx && onCanvasReady) {
      onCanvasReady(canvas, ctx);
    }
  }, [canvasRef, getContext, onCanvasReady]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundUrl}')`,
            zIndex: 1,
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing aspect-[3/4] z-10"
      />
    </div>
  );
}

