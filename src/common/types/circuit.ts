// using ids for connections to allow for easier serialization and deserialization

export type CircuitElement = {
  id: string;
  x: number;
  y: number;
  nodes: Node[];
  type: string;
};

export type Wire = {
  toNodeId: string;
  fromNodeId: string;
  id: string;
  resistance?: number;
};

export type Node = {
  id: string;
  x: number;
  y: number;
  parentId: string;
};

export type Size =
  | { width: number; height: number; radius?: never }
  | { radius: number; width?: never; height?: never };

export type EditingWire = {
  wireId: string;
  end: "from" | "to";
};
