import { useCallback, useEffect, useRef, useState } from "react";
import { Grid } from "../types";
import {
  UseTranslatePositionRtn,
  useResizeObserver,
  useScale,
  useTranslatePosition,
} from "../using-utils";

// https://www.jgibson.id.au/blog/responsive-canvas/
// https://jsfiddle.net/u5ogmh9a/
export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [grid, setGrid] = useState<Grid>({
    rectangles: [
      {
        x: 50,
        y: 500,
        width: 100,
        height: 100,
      },
    ],
    gridSquareSize: 25,
  });

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

  useResizeObserver(canvasRef, redraw);
  return <canvas ref={canvasRef} className="bg-white w-full h-full"></canvas>;
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
    drawGrid(cssWidth, grid, ctx, cssHeight);
    drawRectangles(grid, ctx);
  }
}

function drawRectangles(grid: Grid, ctx: CanvasRenderingContext2D) {
  for (const rectangle of grid.rectangles) {
    ctx.fillStyle = "red";
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }
}

function drawGrid(
  cssWidth: number,
  grid: Grid,
  ctx: CanvasRenderingContext2D,
  cssHeight: number,
) {
  let iteration = 0;
  for (let i = 0; i < cssWidth; i += grid.gridSquareSize) {
    if (iteration % 5 === 0) {
      ctx.strokeStyle = "black";
    } else {
      ctx.strokeStyle = "grey";
    }
    ctx.beginPath();
    iteration++;
    ctx.moveTo(i, 0);
    ctx.lineTo(i, cssHeight);
    ctx.stroke();
  }

  iteration = 0;
  for (let i = 0; i < cssHeight; i += grid.gridSquareSize) {
    if (iteration % 5 === 0) {
      ctx.strokeStyle = "black";
    } else {
      ctx.strokeStyle = "grey";
    }
    iteration++;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(cssWidth, i);
    ctx.stroke();
  }
}
