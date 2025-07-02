export type Element = {
  id: string;
  x: number;
  y: number;
  size: Size;
  type: "bulb" | "resistor" | "capacitor" | "inductor";
};

export type Wire = {
  to: Node;
  from: Node;
  id: string;
};

export type Node = {
  id: string;
  x: number;
  y: number;
  parentId?: string;
  parent: Element | null;
};

export type Size =
  | { width: number; height: number; radius?: never }
  | { radius: number; width?: never; height?: never };
