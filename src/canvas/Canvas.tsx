import { MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { DrawMode, Grid } from "../types";
import {
  UseTranslatePositionRtn,
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
};

export default function Canvas({ grid, onGridChange, drawMode }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = useScale(canvasRef);
  const translate = useTranslatePosition(canvasRef);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      draw(canvas, grid, scale, translate);
    }
  }, [grid, scale, translate]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onCanvasClick = useCallback<MouseEventHandler<HTMLCanvasElement>>(
    (e) => {
      if (drawMode === "addRectangle") {
        const canvas = canvasRef.current;
        if (canvas) {
          const { x, y } = effectiveXY(e, canvas, translate, scale);
          grid.rectangles.push({
            x: x,
            y: y,
            width: 100,
            height: 100,
          });
          const newGrid = {
            ...grid,
            rectangles: [
              ...grid.rectangles,
              {
                x: x,
                y: y,
                width: 100,
                height: 100,
              },
            ],
          };
          onGridChange(newGrid);
        }
      }
    },
    [drawMode, onGridChange, grid, translate, scale],
  );

  useResizeObserver(canvasRef, redraw);
  return (
    <canvas
      ref={canvasRef}
      onClick={onCanvasClick}
      className="bg-white w-full h-full"
    ></canvas>
  );
}

function effectiveXY(
  e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  canvas: HTMLCanvasElement,
  translate: UseTranslatePositionRtn,
  scale: number,
) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - translate.translateX) / scale;
  const y = (e.clientY - rect.top - translate.translateY) / scale;
  return { x, y };
}

function draw(
  canvas: HTMLCanvasElement,
  grid: Grid,
  scale: number,
  translate: UseTranslatePositionRtn,
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
  }
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
