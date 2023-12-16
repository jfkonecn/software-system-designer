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
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  if (ctx) {
    let iteration = 0;
    for (let i = 0; i < canvas.width; i += grid.gridSquareSize) {
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
    for (let i = 0; i < canvas.height; i += grid.gridSquareSize) {
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
