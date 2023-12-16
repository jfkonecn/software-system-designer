import { useCallback, useEffect, useRef, useState } from "react";
import { Grid } from "../types";
import { useResizeObserver } from "../using-utils";

// https://www.jgibson.id.au/blog/responsive-canvas/
export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [grid, setGrid] = useState<Grid>({
    rectangles: [],
    gridSquareSize: 25,
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawGrid(canvas, grid);
    }
  }, [grid]);

  const onResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawGrid(canvas, grid);
    }
  }, [grid]);

  useResizeObserver(canvasRef, onResize);
  return <canvas ref={canvasRef} className="bg-white w-full h-full"></canvas>;
}

function drawGrid(canvas: HTMLCanvasElement, grid: Grid) {
  const ctx = canvas.getContext("2d");
  const { cssWidth, cssHeight, pxWidth, pxHeight, dpr } = canvasDims(canvas);
  canvas.width = pxWidth;
  canvas.height = pxHeight;
  if (ctx) {
    ctx.scale(dpr, dpr);
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
      ctx.lineTo(i, canvas.height);
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
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }
}

function canvasDims(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const pxWidth = Math.round(dpr * cssWidth);
  const pxHeight = Math.round(dpr * cssHeight);
  return { dpr, cssWidth, cssHeight, pxWidth, pxHeight };
}
