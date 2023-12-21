import {
  MouseEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { DrawMode, Grid, Node, SelectMode } from "../types";
import {
  UseCursorRtn,
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
  const [mouseMoved, setMouseMoved] = useState(false);
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

  const onMouseDown = useCallback<MouseEventHandler<HTMLCanvasElement>>(
    (e) => {
      e.preventDefault();
      setMouseMoved(false);
      if (e.button === 0) {
        if (drawMode.typename === "addNode") {
          if (drawMode.phase.typename === "idle") {
            onDrawModeChange({
              typename: "addNode",
              phase: { typename: "adding", start: cursor },
            });
          } else if (drawMode.phase.typename === "adding") {
            const canvas = canvasRef.current;
            if (canvas) {
              const deltaX = cursor.x - drawMode.phase.start.x;
              const deltaY = cursor.y - drawMode.phase.start.y;
              const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

              grid.nodes.push({
                x: drawMode.phase.start.x,
                y: drawMode.phase.start.y,
                radius,
                uuid: crypto.randomUUID(),
              });
              onGridChange(grid);
              onDrawModeChange({
                typename: "addNode",
                phase: { typename: "idle" },
              });
            }
          }
        } else if (
          drawMode.typename === "select" &&
          drawMode.phase.typename !== "movingNode"
        ) {
          const uuids: string[] = [];
          for (const node of grid.nodes) {
            const intersects = nodeIntersectsWithLasso(cursor, cursor, node);
            if (intersects) {
              uuids.push(node.uuid);
            }
          }
          if (uuids.length > 0 && drawMode.phase.typename === "selected") {
            onDrawModeChange({
              typename: "select",
              phase: {
                typename: "movingNode",
                start: cursor,
                uuids: uuids,
              },
            });
          } else if (
            drawMode.phase.typename === "idle" ||
            drawMode.phase.typename === "selected"
          ) {
            onDrawModeChange({
              typename: "select",
              phase: { typename: "lasso", start: cursor },
            });
          }
        }
        return false;
      }
    },
    [drawMode, onGridChange, grid, cursor, onDrawModeChange],
  );

  const onMouseUp = useCallback<MouseEventHandler<HTMLCanvasElement>>(
    (e) => {
      if (
        drawMode.typename === "select" &&
        drawMode.phase.typename === "movingNode"
      ) {
        onDrawModeChange({
          typename: "select",
          phase: { typename: "idle" },
        });
      } else if (
        drawMode.typename === "select" &&
        drawMode.phase.typename === "lasso" &&
        e.button === 0
      ) {
        let selectedUuids: string[] = [];
        for (const node of grid.nodes) {
          const intersects = nodeIntersectsWithLasso(
            cursor,
            drawMode.phase.start,
            node,
          );

          if (intersects) {
            selectedUuids.push(node.uuid);
          }
        }
        selectedUuids = mouseMoved
          ? selectedUuids
          : selectedUuids.length > 0
            ? [selectedUuids[selectedUuids.length - 1]]
            : [];
        onDrawModeChange({
          typename: "select",
          phase: { typename: "selected", uuids: selectedUuids },
        });
      }
      setMouseMoved(false);
    },
    [drawMode, grid, cursor, onDrawModeChange, mouseMoved],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawMode.typename === "select") {
        onDrawModeChange({
          typename: "select",
          phase: { typename: "idle" },
        });
      } else if (e.key === "Escape" && drawMode.typename === "addNode") {
        onDrawModeChange({
          typename: "addNode",
          phase: { typename: "idle" },
        });
      } else if (e.key === "Delete" && drawMode.typename === "select") {
        const phase = drawMode.phase;
        if (phase.typename === "selected") {
          const newRectangles = grid.nodes.filter(
            (rectangle) => !phase.uuids.includes(rectangle.uuid),
          );
          onGridChange({ ...grid, nodes: newRectangles });
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
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={() => setMouseMoved(true)}
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

function nodeIntersectsWithLasso(
  cursor: UseCursorRtn,
  lassoStart: { x: number; y: number },
  node: Node,
) {
  const minXSelected = Math.min(cursor.x, lassoStart.x);
  const minYSelected = Math.min(cursor.y, lassoStart.y);
  const maxXSelected = Math.max(cursor.x, lassoStart.x);
  const maxYSelected = Math.max(cursor.y, lassoStart.y);
  const closestX = Math.max(minXSelected, Math.min(node.x, maxXSelected));
  const closestY = Math.max(minYSelected, Math.min(node.y, maxYSelected));

  const distanceX = node.x - closestX;
  const distanceY = node.y - closestY;

  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  const intersects = distanceSquared <= node.radius * node.radius;
  return intersects;
}

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
    drawNodes(contextState);
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
    drawMode.typename === "addNode" &&
    drawMode.phase.typename === "adding"
  ) {
    ctx.strokeStyle = "green";
    const deltaX = x - drawMode.phase.start.x;
    const deltaY = y - drawMode.phase.start.y;
    const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    ctx.beginPath();
    ctx.arc(
      drawMode.phase.start.x,
      drawMode.phase.start.y,
      radius,
      0,
      2 * Math.PI,
    );
    ctx.stroke();
  }
}

function drawNodes({ grid, ctx, drawMode }: ContextState) {
  const selectedUuids =
    drawMode.typename === "select" && drawMode.phase.typename === "selected"
      ? drawMode.phase.uuids
      : drawMode.typename === "select" &&
          drawMode.phase.typename === "movingNode"
        ? drawMode.phase.uuids
        : [];
  for (const node of grid.nodes) {
    if (selectedUuids.includes(node.uuid)) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = grid.gridSquareSize / 5;
      ctx.setLineDash([grid.gridSquareSize / 5, grid.gridSquareSize / 5]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
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
