export type Node = {
  x: number;
  y: number;
  radius: number;
  uuid: string;
};

export type Grid = {
  nodes: Node[];
  edges: Edge[];
  gridSquareSize: number;
};

export type Edge = {
  uuid: string;
  startUuid: string;
  endUuid: string;
};

export type SelectMode = {
  typename: "select";
  phase:
    | { typename: "idle" }
    | { typename: "lasso"; start: { x: number; y: number } }
    | {
        typename: "movingNode";
        start: { x: number; y: number };
        startNodes: Node[];
      }
    | { typename: "selected"; uuids: string[] };
};

export type AddNodeMode = {
  typename: "addNode";
  phase:
    | { typename: "idle" }
    | { typename: "adding"; start: { x: number; y: number } };
};

export type AddEdgeMode = {
  typename: "addEdge";
  phase: { typename: "idle" } | { typename: "adding"; startUuid: string };
};

export type DrawMode = SelectMode | AddNodeMode | AddEdgeMode;
