export type Node = {
  x: number;
  y: number;
  radius: number;
  uuid: string;
};

export type Grid = {
  nodes: Node[];
  gridSquareSize: number;
};

export type SelectMode = {
  typename: "select";
  phase:
    | { typename: "idle" }
    | { typename: "lasso"; start: { x: number; y: number } }
    | {
        typename: "movingNode";
        start: { x: number; y: number };
        uuids: string[];
      }
    | { typename: "selected"; uuids: string[] };
};

export type AddNodeMode = {
  typename: "addNode";
  phase:
    | { typename: "idle" }
    | { typename: "adding"; start: { x: number; y: number } };
};

export type DrawMode = SelectMode | AddNodeMode;
