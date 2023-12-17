import {
  MouseEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { DrawMode, Grid } from "../types";
import {
  UseTranslatePositionRtn,
  useCursor,
  useDocumentKeyDown,
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
      e.preventDefault();
      if (drawMode.typename === "addRectangle") {
        if (drawMode.phase.typename === "idle") {
          onDrawModeChange({
            typename: "addRectangle",
            phase: { typename: "adding", start: cursor },
          });
        } else if (drawMode.phase.typename === "adding") {
          const canvas = canvasRef.current;
          if (canvas) {
            const minXSelected = Math.min(cursor.x, drawMode.phase.start.x);
            const minYSelected = Math.min(cursor.y, drawMode.phase.start.y);
            const maxXSelected = Math.max(cursor.x, drawMode.phase.start.x);
            const maxYSelected = Math.max(cursor.y, drawMode.phase.start.y);
            grid.rectangles.push({
              x: minXSelected,
              y: minYSelected,
              width: maxXSelected - minXSelected,
              height: maxYSelected - minYSelected,
              uuid: crypto.randomUUID(),
            });
            onGridChange(grid);
            onDrawModeChange({
              typename: "addRectangle",
              phase: { typename: "idle" },
            });
          }
        }
      } else if (drawMode.typename === "select") {
        if (
          drawMode.phase.typename === "idle" ||
          drawMode.phase.typename === "selected"
        ) {
          onDrawModeChange({
            typename: "select",
            phase: { typename: "lasso", start: cursor },
          });
        } else if (drawMode.phase.typename === "lasso") {
          const selectedUuids: string[] = [];
          for (const rectangle of grid.rectangles) {
            const minXSelected = Math.min(cursor.x, drawMode.phase.start.x);
            const minYSelected = Math.min(cursor.y, drawMode.phase.start.y);
            const maxXSelected = Math.max(cursor.x, drawMode.phase.start.x);
            const maxYSelected = Math.max(cursor.y, drawMode.phase.start.y);
            const minXRectangle = rectangle.x;
            const minYRectangle = rectangle.y;
            const maxXRectangle = rectangle.x + rectangle.width;
            const maxYRectangle = rectangle.y + rectangle.height;
            if (
              minXSelected < maxXRectangle &&
              maxXSelected > minXRectangle &&
              minYSelected < maxYRectangle &&
              maxYSelected > minYRectangle
            ) {
              selectedUuids.push(rectangle.uuid);
            }
          }
          onDrawModeChange({
            typename: "select",
            phase: { typename: "selected", uuids: selectedUuids },
          });
        }
      }
      return false;
    },
    [drawMode, onGridChange, grid, cursor, onDrawModeChange],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawMode.typename === "select") {
        onDrawModeChange({
          typename: "select",
          phase: { typename: "idle" },
        });
      } else if (e.key === "Escape" && drawMode.typename === "addRectangle") {
        onDrawModeChange({
          typename: "addRectangle",
          phase: { typename: "idle" },
        });
      } else if (e.key === "Delete" && drawMode.typename === "select") {
        const phase = drawMode.phase;
        if (phase.typename === "selected") {
          const newRectangles = grid.rectangles.filter(
            (rectangle) => !phase.uuids.includes(rectangle.uuid),
          );
          onGridChange({ ...grid, rectangles: newRectangles });
        }
      }
    },
    [drawMode, onDrawModeChange, grid, onGridChange],
  );
  useDocumentKeyDown(onKeyDown);

  useResizeObserver(canvasRef, redraw);
  return (
    <canvas
      ref={canvasRef}
      onClick={onCanvasClick}
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
  ctx.fillStyle = "black";
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
  } else if (
    drawMode.typename === "addRectangle" &&
    drawMode.phase.typename === "adding"
  ) {
    ctx.strokeStyle = "green";
    ctx.strokeRect(
      drawMode.phase.start.x,
      drawMode.phase.start.y,
      x - drawMode.phase.start.x,
      y - drawMode.phase.start.y,
    );
  }
}

function drawRectangles({ grid, ctx, drawMode }: ContextState) {
  const selectedUuids =
    drawMode.typename === "select" && drawMode.phase.typename === "selected"
      ? drawMode.phase.uuids
      : [];
  for (const rectangle of grid.rectangles) {
    if (selectedUuids.includes(rectangle.uuid)) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = grid.gridSquareSize / 5;
      ctx.setLineDash([grid.gridSquareSize / 5, grid.gridSquareSize / 5]);
      ctx.strokeRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height,
      );
    } else {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}

function drawGrid({ grid, ctx }: ContextState) {
  ctx.lineWidth = 1;
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
