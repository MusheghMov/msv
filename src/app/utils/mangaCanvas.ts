import type { TLCameraOptions } from "tldraw";

/**
 * Constants for manga artboard dimensions and styling
 */
export const MANGA_ARTBOARD = {
  WIDTH: 2000,
  HEIGHT: 1200, // 5:3 ratio typical for manga panels
  PADDING: 50,
  BACKGROUND_COLOR: "#ffffff",
  BORDER_COLOR: "#e2e8f0",
  BORDER_WIDTH: 2,
  OPACITY: 0.1,
} as const;

/**
 * Camera options configuration for manga artboard
 * Constrains viewport to the artboard bounds with comfortable padding
 */
export const MANGA_CAMERA_OPTIONS: TLCameraOptions = {
  constraints: {
    initialZoom: "fit-max",
    baseZoom: "fit-max",
    bounds: { 
      x: 0, 
      y: 0, 
      w: MANGA_ARTBOARD.WIDTH, 
      h: MANGA_ARTBOARD.HEIGHT 
    },
    behavior: { x: "contain", y: "contain" },
    padding: { x: MANGA_ARTBOARD.PADDING, y: MANGA_ARTBOARD.PADDING },
    origin: { x: 0.5, y: 0.5 },
  },
  isLocked: false,
  wheelBehavior: "zoom",
  panSpeed: 1,
  zoomSpeed: 1,
  zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4, 8],
};

/**
 * Utility function to check if a point is within artboard bounds
 */
export function isWithinArtboard(x: number, y: number): boolean {
  return (
    x >= 0 &&
    x <= MANGA_ARTBOARD.WIDTH &&
    y >= 0 &&
    y <= MANGA_ARTBOARD.HEIGHT
  );
}

/**
 * Utility function to constrain coordinates to artboard bounds
 */
export function constrainToArtboard(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(MANGA_ARTBOARD.WIDTH, x)),
    y: Math.max(0, Math.min(MANGA_ARTBOARD.HEIGHT, y)),
  };
}

/**
 * Calculate the center point of the artboard
 */
export function getArtboardCenter(): { x: number; y: number } {
  return {
    x: MANGA_ARTBOARD.WIDTH / 2,
    y: MANGA_ARTBOARD.HEIGHT / 2,
  };
}