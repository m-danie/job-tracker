"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import Link from "next/link";
import { startTransition, useId, useOptimistic } from "react";
import { toast } from "sonner";
import { moveApplicationAction } from "@/app/(app)/applications/actions";
import type { BoardApplication } from "@/db/queries";
import { formatDate } from "@/utils/format";
import { STAGE_LABELS, STAGES, type Stage } from "@/utils/stages";

// Complete class names so Tailwind can see them
const COLUMN_ACCENT: Record<Stage, string> = {
  applied: "border-t-neutral",
  interview: "border-t-info",
  offer: "border-t-success",
  rejected: "border-t-error",
};

// Keyboard drags: Left/Right arrows jump a whole column instead of 25px
const jumpToColumn: KeyboardCoordinateGetter = (event, { context }) => {
  const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.code];
  const { collisionRect, droppableRects } = context;
  if (!direction || !collisionRect) return undefined;
  event.preventDefault();

  const centerX = collisionRect.left + collisionRect.width / 2;
  const distance = (stage: Stage) => {
    const rect = droppableRects.get(stage);
    return rect ? Math.abs(rect.left + rect.width / 2 - centerX) : Infinity;
  };
  const current = STAGES.indexOf(
    STAGES.reduce((closest, stage) => (distance(stage) < distance(closest) ? stage : closest)),
  );
  const target = droppableRects.get(STAGES[current + direction]);
  if (!target) return undefined;
  return {
    x: target.left + (target.width - collisionRect.width) / 2,
    y: target.top + 48,
  };
};

export function Board({ applications }: { applications: BoardApplication[] }) {
  const [items, moveItem] = useOptimistic(
    applications,
    (state, { id, stage }: { id: string; stage: Stage }) =>
      state.map((item) =>
        item.id === id ? { ...item, stage, stageChangedAt: new Date() } : item,
      ),
  );
  const sensors = useSensors(
    // A short drag threshold keeps plain clicks on the card's link working
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpToColumn }),
  );
  // Stable id avoids a hydration mismatch in dnd-kit's generated aria ids
  const id = useId();

  function handleDragEnd({ active, over }: DragEndEvent) {
    const stage = over?.id as Stage | undefined;
    const item = items.find((i) => i.id === active.id);
    if (!stage || !item || item.stage === stage) return;
    startTransition(async () => {
      moveItem({ id: item.id, stage });
      try {
        await moveApplicationAction(item.id, stage);
      } catch {
        // The optimistic move rolls back on its own when the transition ends
        toast.error("Couldn't move the application. Please try again.");
      }
    });
  }

  const nameOf = (activeId: string | number) => {
    const item = items.find((i) => i.id === activeId);
    return item ? `${item.role} at ${item.company}` : "Application";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} is over ${STAGE_LABELS[over.id as Stage]}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} moved to ${STAGE_LABELS[over.id as Stage]}.`
        : `${nameOf(active.id)} was dropped outside the board.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            items={items.filter((item) => item.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ stage, items }: { stage: Stage; items: BoardApplication[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      aria-label={STAGE_LABELS[stage]}
      className={`min-h-48 rounded-box border-t-4 bg-base-200 p-3 transition-colors ${COLUMN_ACCENT[stage]} ${isOver ? "bg-base-300" : ""}`}
    >
      <h2 className="mb-3 flex items-center justify-between font-semibold">
        {STAGE_LABELS[stage]}
        <span className="badge badge-sm">{items.length}</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function Card({ item }: { item: BoardApplication }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-roledescription="draggable application"
      className={`card card-sm cursor-grab bg-base-100 shadow-sm ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <div className="card-body">
        <Link href={`/applications/${item.id}`} className="card-title text-base link-hover">
          {item.role}
        </Link>
        <p className="text-sm text-base-content/70">{item.company}</p>
        <p className="text-xs text-base-content/60">
          Since {formatDate(item.stageChangedAt)}
        </p>
      </div>
    </li>
  );
}
