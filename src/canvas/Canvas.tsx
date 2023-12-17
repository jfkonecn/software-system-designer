import { MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { DrawMode, Grid } from "../types";
import {
  UseTranslatePositionRtn,
  useCursor,
  useResizeObserver,
  useScale,
  useTranslatePosition,
} from "../using-utils";

// https://www.jgibson.id.au/blog/responsive-canvas/
// https://jsfiddle.net/u5ogmh9a/

type CanvasProps = {
  grid: Grid;
  onGridChange: (grid: Grid) => void;
  drawMode: DrawMode;
  onDrawModeChange: (drawMode: DrawMode) => void;
  snapToGrid: boolean;
};

export default function Canvas({
  grid,
  onGridChange,
  drawMode,
  onDrawModeChange,
  snapToGrid,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = useScale(canvasRef);
  const translate = useTranslatePosition(canvasRef);

  const cursor = useCursor({ canvasRef, scale, translate, grid, snapToGrid });
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      draw({ canvas, grid, scale, translate, cursor, drawMode });
    }
  }, [grid, scale, translate, cursor, drawMode]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onCanvasClick = useCallback<MouseEventHandler<HTMLCanvasElement>>(
    (e) => {
      console.log("canvas click");
      e.preventDefault();
      if (drawMode.typename === "addRectangle") {
        const canvas = canvasRef.current;
        if (canvas) {
          grid.rectangles.push({
            x: cursor.x,
            y: cursor.y,
            width: 100,
            height: 100,
          });
          onGridChange(grid);
        }
      } else if (e.button == 2 && drawMode.typename === "select") {
        onDrawModeChange({
          typename: "select",
          phase: { typename: "idle" },
        });
      } else if (drawMode.typename === "select") {
        onDrawModeChange({
          typename: "select",
          phase: { typename: "lasso", start: cursor },
        });
      }
      return false;
    },
    [drawMode, onGridChange, grid, cursor, onDrawModeChange],
  );

  useResizeObserver(canvasRef, redraw);
  return (
    <canvas
      ref={canvasRef}
      onClick={onCanvasClick}
      onMouseDown={onCanvasClick}
      className="bg-white w-full h-full"
      onContextMenu={(e) => e.preventDefault()}
    ></canvas>
  );
}

type CanvasState = {
  canvas: HTMLCanvasElement;
  grid: Grid;
  scale: number;
  translate: UseTranslatePositionRtn;
  cursor: { x: number; y: number };
  drawMode: DrawMode;
};

type ContextState = Omit<CanvasState, "canvas"> & {
  ctx: CanvasRenderingContext2D;
};

function draw({
  canvas,
  grid,
  scale,
  translate,
  cursor,
  drawMode,
}: CanvasState) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio * scale;
  const cssWidth = Math.round(canvas.clientWidth / scale);
  const cssHeight = Math.round(canvas.clientHeight / scale);
  const pxWidth = Math.round(dpr * cssWidth);
  const pxHeight = Math.round(dpr * cssHeight);
  canvas.width = pxWidth;
  canvas.height = pxHeight;
  if (ctx) {
    ctx.translate(translate.translateX, translate.translateY);
    ctx.scale(dpr, dpr);
    const contextState: ContextState = {
      ctx,
      grid,
      scale,
      translate,
      cursor,
      drawMode,
    };
    drawGrid(contextState);
    drawRectangles(contextState);
    drawCursor(contextState);
  }
}

function drawCursor({
  ctx,
  grid,
  cursor: { x, y },
  scale,
  drawMode,
}: ContextState) {
  ctx.strokeStyle = "blue";
  const fontSize = 1 / scale + 1;
  ctx.font = `${fontSize}rem Arial`;
  ctx.lineWidth = grid.gridSquareSize / 5;
  const textOffset = grid.gridSquareSize / 2;
  ctx.fillText(
    `${x.toFixed(2)}, ${y.toFixed(2)}`,
    x + textOffset,
    y - textOffset,
  );
  const crossHairSize = grid.gridSquareSize * 5;
  ctx.beginPath();
  ctx.moveTo(x - crossHairSize, y);
  ctx.lineTo(x + crossHairSize, y);
  ctx.moveTo(x, y - crossHairSize);
  ctx.lineTo(x, y + crossHairSize);
  ctx.stroke();
  if (drawMode.typename === "select" && drawMode.phase.typename === "lasso") {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(drawMode.phase.start.x, drawMode.phase.start.y);
    ctx.lineTo(x, drawMode.phase.start.y);
    ctx.lineTo(x, y);
    ctx.lineTo(drawMode.phase.start.x, y);
    ctx.lineTo(drawMode.phase.start.x, drawMode.phase.start.y);
    ctx.stroke();
  }
}

function drawRectangles({ grid, ctx }: ContextState) {
  for (const rectangle of grid.rectangles) {
    ctx.fillStyle = "red";
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }
}

function drawGrid({ grid, ctx }: ContextState) {
  let iteration = 0;
  const maxLength = 2000;
  for (let i = -maxLength; i <= maxLength; i += grid.gridSquareSize) {
    if (iteration % 5 === 0) {
      ctx.strokeStyle = "black";
    } else {
      ctx.strokeStyle = "grey";
    }
    ctx.beginPath();
    iteration++;
    ctx.moveTo(i, -maxLength);
    ctx.lineTo(i, maxLength);
    ctx.stroke();
  }

  iteration = 0;
  for (let i = -maxLength; i <= maxLength; i += grid.gridSquareSize) {
    if (iteration % 5 === 0) {
      ctx.strokeStyle = "black";
    } else {
      ctx.strokeStyle = "grey";
    }
    iteration++;
    ctx.beginPath();
    ctx.moveTo(-maxLength, i);
    ctx.lineTo(maxLength, i);
    ctx.stroke();
  }
}
