import { useEffect, useCallback } from 'react';

interface UseCanvasResizeReturn {
  resizeCanvas: () => void;
}

/**
 * Custom hook for managing canvas resize behavior
 */
export function useCanvasResize(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onResize?: () => void
): UseCanvasResizeReturn {
  
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
      
      // Call the optional callback after resize
      if (onResize) {
        onResize();
      }
    }
  }, [canvasRef, onResize]);

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
    window.addEventListener('resize', resizeCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  return {
    resizeCanvas
  };
}