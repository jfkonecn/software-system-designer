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
  snapToGrid: boolean;
};

export default function Canvas({
  grid,
  onGridChange,
  drawMode,
  snapToGrid,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = useScale(canvasRef);
  const translate = useTranslatePosition(canvasRef);

  const cursor = useCursor({ canvasRef, scale, translate, grid, snapToGrid });
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      draw(canvas, grid, scale, translate, cursor);
    }
  }, [grid, scale, translate, cursor]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onCanvasClick = useCallback<
    MouseEventHandler<HTMLCanvasElement>
  >(() => {
    if (drawMode === "addRectangle") {
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
    }
  }, [drawMode, onGridChange, grid, cursor]);

  useResizeObserver(canvasRef, redraw);
  return (
    <canvas
      ref={canvasRef}
      onClick={onCanvasClick}
      className="bg-white w-full h-full"
    ></canvas>
  );
}

function draw(
  canvas: HTMLCanvasElement,
  grid: Grid,
  scale: number,
  translate: UseTranslatePositionRtn,
  cursor: { x: number; y: number },
) {
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
    drawGrid(grid, ctx);
    drawRectangles(grid, ctx);
    drawCursor(ctx, grid, cursor, scale);
  }
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  { x, y }: { x: number; y: number },
  scale: number,
) {
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
}

function drawRectangles(grid: Grid, ctx: CanvasRenderingContext2D) {
  for (const rectangle of grid.rectangles) {
    ctx.fillStyle = "red";
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }
}

function drawGrid(grid: Grid, ctx: CanvasRenderingContext2D) {
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
