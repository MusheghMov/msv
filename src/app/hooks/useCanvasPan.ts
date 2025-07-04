import { useState, useCallback, useRef } from 'react';
import type { CanvasState } from '@/app/types/manga';

interface UseCanvasPanReturn {
  canvasState: CanvasState;
  startDrag: (clientX: number, clientY: number) => void;
  drag: (clientX: number, clientY: number) => void;
  endDrag: () => void;
  resetPan: () => void;
}

/**
 * Custom hook for managing canvas pan/drag functionality
 */
export function useCanvasPan(): UseCanvasPanReturn {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  });

  const startDrag = useCallback((clientX: number, clientY: number) => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: true,
      lastX: clientX,
      lastY: clientY
    }));
  }, []);

  const drag = useCallback((clientX: number, clientY: number) => {
    setCanvasState(prev => {
      if (!prev.isDragging) return prev;
      
      const deltaX = clientX - prev.lastX;
      const deltaY = clientY - prev.lastY;
      
      return {
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastX: clientX,
        lastY: clientY
      };
    });
  }, []);

  const endDrag = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  const resetPan = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      isDragging: false
    }));
  }, []);

  return {
    canvasState,
    startDrag,
    drag,
    endDrag,
    resetPan
  };
}