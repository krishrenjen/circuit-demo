"use client";
import React, { useState, useEffect } from "react";
import { Stage, Layer, Circle, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  CircuitElement,
  EditingWire,
  Wire,
  Node,
} from "@/common/types/circuit";
import RenderElement from "./RenderElement";
import { DebugBox } from "@/components/debug/DebugBox";

export default function Canvas() {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [elements, setElements] = useState<CircuitElement[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [wireCounter, setWireCounter] = useState(0);

  const [creatingWireStartNode, setCreatingWireStartNode] = useState<
    string | null
  >(null);
  const [editingWire, setEditingWire] = useState<EditingWire | null>(null);

  useEffect(() => {
    // Initialize with some elements
    const initialElements: CircuitElement[] = [
      {
        id: "lightbulb-1",
        type: "lightbulb",
        x: 100,
        y: 100,
        nodes: [
          { id: "lightbulb1-node-1", x: 2, y: 40, parentId: "lightbulb-1" },
          { id: "lightbulb1-node-2", x: 40, y: 40, parentId: "lightbulb-1" },
        ],
      },
      {
        id: "lightbulb-2",
        type: "lightbulb",
        x: 200,
        y: 200,
        nodes: [
          { id: "lightbulb2-node-1", x: 2, y: 40, parentId: "lightbulb-2" },
          { id: "lightbulb2-node-2", x: 40, y: 40, parentId: "lightbulb-2" },
        ],
      },
      // Add more elements as needed
    ];

    setElements(initialElements);
  }, []);

  function getNodeById(nodeId: string) {
    return elements.flatMap((e) => e.nodes).find((n) => n.id === nodeId);
  }

  function getElementById(elementId: string) {
    return elements.find((e) => e.id === elementId);
  }

  function getNodeParent(nodeId: string) {
    const node = elements.flatMap((e) => e.nodes).find((n) => n.id === nodeId);
    return node ? getElementById(node.parentId) : null;
  }

  function handleStageMouseMove(e: KonvaEventObject<PointerEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) setMousePos(pos);
  }

  function handleStageClick(e: KonvaEventObject<MouseEvent>) {
    // If editing a wire and clicked not on a node, delete the wire
    if (editingWire) {
      setWires((prev) => prev.filter((w) => w.id !== editingWire.wireId));
      setEditingWire(null);
    }
    // If clicked on empty space, cancel wire creation
    if (creatingWireStartNode) {
      setCreatingWireStartNode(null);
    }
  }

  function handleElementDragMove(e: KonvaEventObject<DragEvent>) {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    console.log(`Element ${id} moved to (${x}, ${y})`);

    setElements((prev) =>
      prev.map((element) =>
        element.id === id ? { ...element, x, y } : element
      )
    );
  }

  function handleWireClick(
    e: KonvaEventObject<MouseEvent>,
    wireId: string,
    fromNode: Node,
    toNode: Node
  ) {
    const clickPos = e.target.getStage()?.getPointerPosition();
    if (!clickPos) return;

    const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const clickedEnd =
      dist(clickPos, { x: fromNode.x, y: fromNode.y }) <
      dist(clickPos, { x: toNode.x, y: toNode.y })
        ? "from"
        : "to";

    setEditingWire({ wireId, end: clickedEnd });
    setCreatingWireStartNode(null); // cancel any wire creation
  }

  function getWirePoints(wire: Wire): [number, number, number, number] | null {
    const fromNode = getNodeById(wire.fromNodeId);
    const toNode = getNodeById(wire.toNodeId);
    if (!fromNode || !toNode) return null;

    const getAbsolutePos = (node: Node) => {
      const parent = getNodeParent(node.id);
      return {
        x: node.x + (parent?.x ?? 0),
        y: node.y + (parent?.y ?? 0),
      };
    };

    const isEditingFrom =
      editingWire?.wireId === wire.id && editingWire.end === "from";
    const isEditingTo =
      editingWire?.wireId === wire.id && editingWire.end === "to";

    const start = isEditingFrom ? mousePos : getAbsolutePos(fromNode);
    const end = isEditingTo ? mousePos : getAbsolutePos(toNode);

    return [start.x, start.y, end.x, end.y];
  }

  function handleNodeClick(nodeId: string) {
    if (editingWire) {
      // Finish editing wire
      setWires((prev) =>
        prev.map((wire) =>
          wire.id === editingWire.wireId
            ? { ...wire, [editingWire.end]: nodeId }
            : wire
        )
      );
      setEditingWire(null);
    } else if (creatingWireStartNode === null) {
      // Start new wire
      setCreatingWireStartNode(nodeId);
    } else if (creatingWireStartNode === nodeId) {
      // Cancel new wire
      setCreatingWireStartNode(null);
    } else {
      // Complete new wire
      const newWire: Wire = {
        id: `wire-${wireCounter}`,
        fromNodeId: creatingWireStartNode,
        toNodeId: nodeId,
      };
      setWires((prev) => [...prev, newWire]);
      setWireCounter((c) => c + 1);
      setCreatingWireStartNode(null);
    }
  }

  return (
    <div className="flex flex-row items-center justify-center h-screen w-screen">
      <DebugBox
        data={{ mousePos, elements, wires }}
        className="w-full !h-screen"
      />
      <Stage
        width={window.innerWidth * 0.75}
        height={window.innerHeight}
        onMouseMove={handleStageMouseMove}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Render all wires */}
          {wires.map((wire) => {
            const points = getWirePoints(wire);
            if (!points) return null;

            return (
              <Line
                key={wire.id}
                points={points}
                stroke="#2c3e50"
                strokeWidth={3}
                hitStrokeWidth={15}
                onClick={(e) => {
                  const from = getNodeById(wire.fromNodeId)!;
                  const to = getNodeById(wire.toNodeId)!;
                  handleWireClick(e, wire.id, from, to);
                }}
              />
            );
          })}

          {/* Render wire currently being created */}
          {creatingWireStartNode &&
            (() => {
              const startNode = getNodeById(creatingWireStartNode);

              if (!startNode) return null;
              const startNodeX =
                startNode.x + (getNodeParent(startNode.id)?.x ?? 0);
              const startNodeY =
                startNode.y + (getNodeParent(startNode.id)?.y ?? 0);

              return (
                <Line
                  points={[startNodeX, startNodeY, mousePos.x, mousePos.y]}
                  stroke="#e74c3c"
                  strokeWidth={3}
                  dash={[10, 5]}
                  pointerEvents="none"
                />
              );
            })()}

          {elements.map((element) => (
            <RenderElement
              key={element.id}
              element={element}
              onDragMove={handleElementDragMove}
              handleNodeClick={handleNodeClick}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
