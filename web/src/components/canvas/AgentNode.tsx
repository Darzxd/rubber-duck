import StickyNote, { type StickyTone } from "./StickyNote";
import type { AgentNode as AgentNodeData } from "@/lib/board";

type AgentNodeProps = {
  node: AgentNodeData;
  index: number;
};

const TONES: StickyTone[] = ["amber", "blue", "green", "pink", "violet"];
const TILTS = [-2, 1.5, -1, 2.5, -1.5, 1];

export default function AgentNode({ node, index }: AgentNodeProps) {
  const cols = 4;
  const x = 12 + (index % cols) * 21;
  const y = 16 + Math.floor(index / cols) * 22;

  return (
    <StickyNote
      tag={node.topic || node.author}
      tone={TONES[index % TONES.length]}
      x={x}
      y={y}
      tilt={TILTS[index % TILTS.length]}
    >
      {node.label}
    </StickyNote>
  );
}
