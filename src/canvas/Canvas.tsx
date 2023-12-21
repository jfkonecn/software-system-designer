import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { DrawMode, Grid, Node } from "../types";
import {
  UseCursorRtn,
  useCursor,
  useDocumentKeyDown,
  useResizeObserver,
  useScale,
  useTranslatePosition,
} from "../using-utils";
import { draw } from "./draw-utils";

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
        } else if (drawMode.typename === "addEdge") {
          let selectedNode: Node | undefined;
          for (const node of grid.nodes) {
            const intersects = nodeIntersectsWithLasso(cursor, cursor, node);
            if (intersects) {
              selectedNode = node;
            }
          }
          const phase = drawMode.phase;
          if (drawMode.phase.typename === "idle" && selectedNode) {
            onDrawModeChange({
              typename: "addEdge",
              phase: { typename: "adding", startUuid: selectedNode.uuid },
            });
          } else if (phase.typename === "adding" && selectedNode) {
            const canvas = canvasRef.current;
            const startNode = grid.nodes.find((x) =>
              phase.startUuid.includes(x.uuid),
            );
            if (canvas && startNode) {
              grid.edges.push({
                startUuid: startNode.uuid,
                endUuid: selectedNode.uuid,
                uuid: crypto.randomUUID(),
              });

              onGridChange(grid);
              onDrawModeChange({
                typename: "addEdge",
                phase: { typename: "idle" },
              });
            }
          } else {
            onDrawModeChange({
              typename: "addEdge",
              phase: { typename: "idle" },
            });
          }
        } else if (
          drawMode.typename === "select" &&
          drawMode.phase.typename !== "movingNode"
        ) {
          let hasSelected = false;
          for (const node of grid.nodes) {
            const intersects = nodeIntersectsWithLasso(cursor, cursor, node);
            if (intersects) {
              hasSelected = true;
              break;
            }
          }
          const phase = drawMode.phase;
          if (hasSelected && phase.typename === "selected") {
            const startNodes = grid.nodes
              .filter((x) => phase.uuids.includes(x.uuid))
              .map((x) => ({ ...x }));
            onDrawModeChange({
              typename: "select",
              phase: {
                typename: "movingNode",
                start: cursor,
                startNodes,
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
          phase: {
            typename: "selected",
            uuids: drawMode.phase.startNodes.map((x) => x.uuid),
          },
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
      } else if (e.key === "Escape" && drawMode.typename === "addEdge") {
        onDrawModeChange({
          typename: "addEdge",
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
  const onMouseMove = useCallback(() => {
    if (drawMode.typename === "select") {
      const phase = drawMode.phase;
      if (phase.typename === "movingNode") {
        const deltaX = cursor.x - phase.start.x;
        const deltaY = cursor.y - phase.start.y;
        for (const startingNode of phase.startNodes) {
          const curNode = grid.nodes.find((x) => x.uuid === startingNode.uuid);
          if (curNode) {
            curNode.x = startingNode.x + deltaX;
            curNode.y = startingNode.y + deltaY;
          }
        }
        onGridChange(grid);
      }
    }
    setMouseMoved(true);
  }, [setMouseMoved, onGridChange, grid, cursor, drawMode]);

  useResizeObserver(canvasRef, redraw);
  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="bg-white w-full h-full"
      onContextMenu={(e) => e.preventDefault()}
    ></canvas>
  );
}

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
