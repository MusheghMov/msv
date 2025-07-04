"use client";

import { useCanvasPan } from "@/app/hooks/useCanvasPan";
import { MangaCanvas } from "./MangaCanvas";
import type { DialogueData } from "@/app/types/manga";
import { cn } from "@/app/lib/utils";

export function CanvasPanZoom({
  dialogues,
}: {
  dialogues: DialogueData[];
  backgroundUrl?: string;
  children?: React.ReactNode;
}) {
  const { canvasState, startDrag, drag, endDrag } = useCanvasPan();

  // Helper function to get event location (handles both mouse and touch)
  const getEventLocation = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length === 1) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return {
      x: (e as React.MouseEvent).clientX,
      y: (e as React.MouseEvent).clientY,
    };
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const location = getEventLocation(e);
    startDrag(location.x, location.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasState.isDragging) return;
    const location = getEventLocation(e);
    drag(location.x, location.y);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handleMouseLeave = () => {
    endDrag();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const location = getEventLocation(e);
    startDrag(location.x, location.y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canvasState.isDragging) return;
    e.preventDefault(); // Prevent scrolling
    const location = getEventLocation(e);
    drag(location.x, location.y);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const handleTouchCancel = () => {
    endDrag();
  };

  return (
    <div
      className={cn(
        "w-full h-full select-none touch-none grab",
        canvasState.isDragging && "cursor-grabbing",
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <MangaCanvas
        dialogues={dialogues}
        offsetX={canvasState.offsetX}
        offsetY={canvasState.offsetY}
        backgroundUrl={canvasState.backgroundUrl}
      />
    </div>
  );
}

