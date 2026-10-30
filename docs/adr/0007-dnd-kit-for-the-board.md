# 0007. dnd-kit for the Kanban board

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-26

## Context

The board needs drag and drop between columns that works with a mouse, touch and the
keyboard, and is announced to screen readers.

## Options considered

- **Native HTML drag and drop**: no dependency, but no touch support and no keyboard or
  screen-reader story.
- **dnd-kit (`@dnd-kit/core`)**: pointer, touch and keyboard sensors, live-region
  announcements, and it works with React 19.

## Decision

dnd-kit core, with a custom keyboard handler that jumps a card one whole column at a time
and spoken announcements for each move. The card's own buttons use
`setActivatorNodeRef`, so pressing Enter on them doesn't start a keyboard drag.

## Consequences

- Moves are optimistic (`useOptimistic`) and roll back with a toast if the server action
  fails.
- dnd-kit swallows the click that ends a drag, so dragging never opens the card popup.
- Cards are sorted by their last stage change. Reordering within a column isn't
  supported yet.
