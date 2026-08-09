"use client";

import AgentCursor from "@/components/agents/AgentCursor";
import BoardLayer from "@/components/canvas/BoardLayer";
import type {
  AgentCursorState,
  Board,
  KnownAgent,
} from "@/lib/board";

const NOOP = () => {};

/** What the Architect drew, on the same renderer the tools draw with.
 *
 * It is a layer of its own under whatever the room draws by hand: agents
 * mutate their board through ops, and have no business undoing a stroke
 * somebody made. Cursors ride above the strokes so the room can see who is
 * about to do what next. */
export default function ArchitectBoard({
  board,
  cursors,
}: {
  board: Board;
  cursors?: Partial<Record<KnownAgent, AgentCursorState>>;
}) {
  const cursorEntries = cursors
    ? (Object.entries(cursors) as [KnownAgent, AgentCursorState][])
    : [];
  if (board.elements.length === 0 && cursorEntries.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <BoardLayer
        elements={board.elements}
        draft={null}
        selectedIds={[]}
        editingId={null}
        editingCell={null}
        onChangeText={NOOP}
        onChangeCell={NOOP}
        onFinishEditing={NOOP}
        onAddRow={NOOP}
        onAddColumn={NOOP}
        onVote={NOOP}
        onChangeQuestion={NOOP}
        onChangeOption={NOOP}
        onAddOption={NOOP}
      />
      {cursorEntries.map(([agent, { x, y }]) => (
        <AgentCursor key={agent} agent={agent} x={x} y={y} />
      ))}
    </div>
  );
}
