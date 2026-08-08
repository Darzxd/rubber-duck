import { colorForAuthor } from "./authors";
import type { AgentNode as AgentNodeData } from "@/lib/board";

type AgentNodeProps = {
  node: AgentNodeData;
  index: number;
};

// Placeholder visual for Architect nodes. Nico will replace with the real
// canvas node design once the pipeline is stable.
export default function AgentNode({ node, index }: AgentNodeProps) {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = 14 + col * 20;
  const y = 18 + row * 18;
  const color = node.author ? colorForAuthor(node.author) : "#111111";

  return (
    <div
      className="pointer-events-auto absolute z-10 max-w-[16rem] rounded-xl border-[3px] bg-white px-3 py-2 shadow-[3px_3px_0_rgba(0,0,0,0.12)]"
      style={{ left: `${x}%`, top: `${y}%`, borderColor: color }}
    >
      {(node.topic || node.author) && (
        <p
          className="text-[0.6rem] font-bold uppercase tracking-widest"
          style={{ color }}
        >
          {node.topic || node.author}
        </p>
      )}
      <p className="text-sm leading-snug text-neutral-900">{node.label}</p>
    </div>
  );
}
