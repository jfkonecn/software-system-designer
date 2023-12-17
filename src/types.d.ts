export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
  uuid: string;
};

export type Grid = {
  rectangles: Rectangle[];
  gridSquareSize: number;
};

export type SelectMode = {
  typename: "select";
  phase:
    | { typename: "idle" }
    | { typename: "lasso"; start: { x: number; y: number } }
    | { typename: "selected"; uuids: string[] };
};

export type AddRectangleMode = {
  typename: "addRectangle";
  phase:
    | { typename: "idle" }
    | { typename: "adding"; start: { x: number; y: number } };
};

export type DrawMode = SelectMode | AddRectangleMode;
