export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Grid = {
  rectangles: Rectangle[];
  gridSquareSize: number;
};

export type DrawMode =
  | { typename: "select" }
  | { typename: "addRectangle" }
  | { typename: "lasso"; start: { x: number; y: number } };
