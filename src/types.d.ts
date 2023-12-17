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

export type SelectMode = {
  typename: "select";
  phase:
    | { typename: "idle" }
    | { typename: "lasso"; start: { x: number; y: number } };
};

export type AddRectangleMode = {
  typename: "addRectangle";
  phase: { typename: "idle" };
};

export type DrawMode = SelectMode | AddRectangleMode;
