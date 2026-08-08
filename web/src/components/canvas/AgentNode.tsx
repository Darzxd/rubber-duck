import { colorForAuthor } from "./authors";
import type { AgentNode as AgentNodeData } from "@/lib/board";

type AgentNodeProps = {
  node: AgentNodeData;
  index: number;
};

const ROTATIONS = [-2, 1.5, -1, 2.5, -1.5, 1];

// Placeholder sticky-note visual for Architect nodes. Nico will replace
// with the real canvas node design once the pipeline is stable.
export default function AgentNode({ node, index }: AgentNodeProps) {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = 12 + col * 21;
  const y = 16 + row * 20;
  const color = node.author ? colorForAuthor(node.author) : "#111111";
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      className="pointer-events-auto absolute z-10 w-[15rem] rounded-lg px-4 py-3 shadow-[4px_6px_0_rgba(0,0,0,0.08)]"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `rotate(${rotation}deg)`,
        background: `color-mix(in srgb, ${color} 14%, white)`,
        borderTop: `4px solid ${color}`,
      }}
    >
      {(node.topic || node.author) && (
        <p
          className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest"
          style={{ color }}
        >
          {node.topic || node.author}
        </p>
      )}
      <p className="text-sm leading-snug text-neutral-900">{node.label}</p>
    </div>
  );
}
