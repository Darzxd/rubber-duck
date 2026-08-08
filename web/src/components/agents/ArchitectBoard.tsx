"use client";

import BoardLayer from "@/components/canvas/BoardLayer";
import type { Board } from "@/lib/board";

const NOOP = () => {};

/** What the Architect drew, on the same renderer the tools draw with.
 *
 * It is a layer of its own under whatever the room draws by hand: the agent
 * replaces its whole board on every revision, and it has no business undoing
 * a stroke somebody made. */
export default function ArchitectBoard({ board }: { board: Board }) {
  if (board.elements.length === 0) return null;

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
    </div>
  );
}
