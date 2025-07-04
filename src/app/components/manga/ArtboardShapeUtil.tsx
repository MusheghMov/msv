import { HTMLContainer, Rectangle2d, ShapeUtil, TLBaseShape } from "tldraw";
import { MANGA_ARTBOARD } from "@/app/utils/mangaCanvas";

// Define the artboard shape type
export type ArtboardShape = TLBaseShape<
  "manga-artboard",
  {
    w: number;
    h: number;
  }
>;

export class ArtboardShapeUtil extends ShapeUtil<ArtboardShape> {
  static override type = "manga-artboard" as const;

  // This shape should not be included in bounds calculations
  getBounds(shape: ArtboardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    });
  }

  getDefaultProps(): ArtboardShape["props"] {
    return {
      w: MANGA_ARTBOARD.WIDTH,
      h: MANGA_ARTBOARD.HEIGHT,
    };
  }

  getGeometry(shape: ArtboardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    });
  }

  // Make the artboard non-interactive
  canEdit = () => false;
  canResize = () => false;
  canBind = () => false;

  component(shape: ArtboardShape) {
    const { w, h } = shape.props;

    const artboardStyle = {
      width: w,
      height: h,
      position: "absolute" as const,
      top: 0,
      left: 0,
      backgroundColor: MANGA_ARTBOARD.BACKGROUND_COLOR,
      border: `${MANGA_ARTBOARD.BORDER_WIDTH}px solid ${MANGA_ARTBOARD.BORDER_COLOR}`,
      opacity: MANGA_ARTBOARD.OPACITY,
      pointerEvents: "none" as const,
      borderRadius: "4px",
      boxSizing: "border-box" as const,
    };

    return (
      <HTMLContainer>
        <div style={artboardStyle}>
          {/* Optional: Add corner indicators or labels */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              fontSize: "12px",
              color: MANGA_ARTBOARD.BORDER_COLOR,
              fontFamily: "system-ui, sans-serif",
              pointerEvents: "none",
              opacity: 0.6,
            }}
          >
            {w} × {h}px
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ArtboardShape) {
    // No indicator for artboard - it's always visible
    return null;
  }

  // Override to prevent the artboard from being selected
  canSelect = () => false;
}