import { DrawMode, Grid } from "../types";
import { UseTranslatePositionRtn } from "../using-utils";

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

export function draw({
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
    drawEdges(contextState);
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
        ? drawMode.phase.startNodes.map((x) => x.uuid)
        : drawMode.typename === "addEdge" &&
            drawMode.phase.typename === "adding"
          ? [drawMode.phase.startUuid]
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
function drawEdges({ ctx, grid }: ContextState) {
  ctx.lineWidth = grid.gridSquareSize / 5;
  ctx.strokeStyle = "black";
  for (const edge of grid.edges) {
    const startNode = grid.nodes.find((x) => x.uuid === edge.startUuid);
    const endNode = grid.nodes.find((x) => x.uuid === edge.endUuid);
    if (startNode && endNode) {
      ctx.beginPath();
      ctx.moveTo(startNode.x, startNode.y);
      ctx.lineTo(endNode.x, endNode.y);
      ctx.stroke();
    }
  }
}
