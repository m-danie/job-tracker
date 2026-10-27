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
import {
  startTransition,
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  deleteApplicationAction,
  moveApplicationAction,
} from "@/app/(app)/applications/actions";
import type { BoardApplication } from "@/db/queries";
import { formatDate, formatSalary } from "@/utils/format";
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

type Change = { id: string; stage: Stage } | { id: string; deleted: true };

export function Board({ applications }: { applications: BoardApplication[] }) {
  const [items, applyChange] = useOptimistic(applications, (state, change: Change) =>
    "deleted" in change
      ? state.filter((item) => item.id !== change.id)
      : state.map((item) =>
          item.id === change.id
            ? { ...item, stage: change.stage, stageChangedAt: new Date() }
            : item,
        ),
  );
  const [viewing, setViewing] = useState<BoardApplication | null>(null);
  const [deleting, setDeleting] = useState<BoardApplication | null>(null);
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
      applyChange({ id: item.id, stage });
      try {
        await moveApplicationAction(item.id, stage);
      } catch {
        // The optimistic move rolls back on its own when the transition ends
        toast.error("Couldn't move the application. Please try again.");
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    startTransition(async () => {
      applyChange({ id, deleted: true });
      try {
        await deleteApplicationAction(id);
        toast.success("Application deleted.");
      } catch {
        toast.error("Couldn't delete the application. Please try again.");
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
            onOpen={setViewing}
            onDelete={setDeleting}
          />
        ))}
      </div>

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="Application">
        {viewing && <ApplicationSummary item={viewing} />}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete application?"
      >
        {deleting && (
          <>
            <p className="py-4">
              This permanently deletes <strong>{deleting.role}</strong> at{" "}
              <strong>{deleting.company}</strong>, including its history. This can&apos;t be
              undone.
            </p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cancel</button>
              </form>
              <button type="button" className="btn btn-error" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </>
        )}
      </Modal>
    </DndContext>
  );
}

// Native <dialog> gives focus trapping and Esc-to-close for free
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby={titleId}>
      <div className="modal-box">
        <h3 id={titleId} className="text-lg font-bold">
          {title}
        </h3>
        {children}
      </div>
      {/* Click-outside-to-close for mice; keyboard and screen readers use Esc or the buttons */}
      <form method="dialog" className="modal-backdrop" aria-hidden="true">
        <button tabIndex={-1}>Close</button>
      </form>
    </dialog>
  );
}

function ApplicationSummary({ item }: { item: BoardApplication }) {
  const salary = formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency);
  return (
    <>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="font-medium">Company</dt>
        <dd>{item.company}</dd>
        <dt className="font-medium">Position</dt>
        <dd>{item.role}</dd>
        <dt className="font-medium">Status</dt>
        <dd>{STAGE_LABELS[item.stage]}</dd>
        <dt className="font-medium">Date applied</dt>
        <dd>{item.appliedOn ? formatDate(item.appliedOn) : "—"}</dd>
        <dt className="font-medium">Salary range</dt>
        <dd>{salary ?? "—"}</dd>
        <dt className="font-medium">Posting</dt>
        <dd className="break-all">
          {item.postingUrl ? (
            <a href={item.postingUrl} className="link" target="_blank" rel="noopener noreferrer">
              {item.postingUrl}
            </a>
          ) : (
            "—"
          )}
        </dd>
        <dt className="font-medium">Notes</dt>
        <dd className="whitespace-pre-wrap">{item.notes || "—"}</dd>
      </dl>
      <div className="modal-action">
        <form method="dialog">
          <button className="btn">Close</button>
        </form>
        <Link href={`/applications/${item.id}`} className="btn btn-primary">
          More details
        </Link>
      </div>
    </>
  );
}

type CardActions = {
  onOpen: (item: BoardApplication) => void;
  onDelete: (item: BoardApplication) => void;
};

function Column({
  stage,
  items,
  ...actions
}: { stage: Stage; items: BoardApplication[] } & CardActions) {
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
          <Card key={item.id} item={item} {...actions} />
        ))}
      </ul>
    </section>
  );
}

function Card({ item, onOpen, onDelete }: { item: BoardApplication } & CardActions) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        // Only keys pressed on the card itself start a keyboard drag, not keys on its buttons
        setActivatorNodeRef(node);
      }}
      style={style}
      {...listeners}
      {...attributes}
      aria-roledescription="draggable application"
      // dnd-kit swallows the click that ends a drag, so this only fires on a plain click
      onClick={() => onOpen(item)}
      className={`card card-sm cursor-grab border border-base-300 bg-base-100 shadow-sm ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <div className="card-body">
        <div className="flex items-start justify-between gap-2">
          {/* Its click bubbles up to the card; the button is the keyboard way in */}
          <button type="button" className="card-title text-left text-base link-hover">
            {item.role}
          </button>
          <button
            type="button"
            aria-label={`Delete ${item.role} at ${item.company}`}
            className="btn btn-square btn-ghost btn-xs"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item);
            }}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <p className="text-sm text-base-content/70">{item.company}</p>
        <p className="text-xs text-base-content/60">
          Since {formatDate(item.stageChangedAt)}
        </p>
      </div>
    </li>
  );
}
