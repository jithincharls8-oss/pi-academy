import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { cellKey, colName } from './formula';
import { COLS, ROWS, type SheetResult } from './sheet';
import { display, type CellValue } from './values';

export interface Selection {
  col: number;
  row: number;
}

const WIDTHS = [
  'w-56',
  'w-36',
  'w-28',
  'w-28',
  'w-36',
  'w-28',
  'w-28',
  'w-32',
  'w-24',
  'w-28',
  'w-24',
  'w-24',
];

function alignRight(v: CellValue): boolean {
  return v.kind === 'number' || v.kind === 'date' || v.kind === 'bool';
}

/**
 * The worksheet grid (WAI-ARIA grid pattern with aria-activedescendant). Arrow keys, Tab and
 * Enter move; typing or F2 starts editing; Delete clears; Escape cancels an edit.
 */
export function Grid({
  result,
  raw,
  selection,
  onSelect,
  editing,
  draft,
  onDraft,
  onStartEdit,
  onCommit,
  onCancel,
  onClear,
  onRecalc,
  gridRef,
}: {
  result: SheetResult;
  raw: (key: string) => string;
  selection: Selection;
  onSelect: (s: Selection) => void;
  editing: boolean;
  draft: string;
  onDraft: (s: string) => void;
  onStartEdit: (initial?: string) => void;
  onCommit: (move: { dc: number; dr: number }) => void;
  onCancel: () => void;
  onClear: () => void;
  onRecalc: () => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
}) {
  const editorRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) editorRef.current?.focus();
  }, [editing]);

  const move = (dc: number, dr: number): void =>
    onSelect({
      col: Math.max(0, Math.min(COLS - 1, selection.col + dc)),
      row: Math.max(0, Math.min(ROWS - 1, selection.row + dr)),
    });

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (editing) return;
    const k = e.key;
    if (k === 'ArrowDown') move(0, 1);
    else if (k === 'ArrowUp') move(0, -1);
    else if (k === 'ArrowLeft') move(-1, 0);
    else if (k === 'ArrowRight') move(1, 0);
    else if (k === 'Enter') move(0, e.shiftKey ? -1 : 1);
    else if (k === 'Tab') move(e.shiftKey ? -1 : 1, 0);
    else if (k === 'Home') onSelect({ col: 0, row: e.ctrlKey ? 0 : selection.row });
    else if (k === 'F2') onStartEdit();
    else if (k === 'F9') onRecalc();
    else if (k === 'Delete' || k === 'Backspace') onClear();
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onStartEdit(k);
    } else return;
    e.preventDefault();
  };

  const onEditorKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') onCommit({ dc: 0, dr: e.shiftKey ? -1 : 1 });
    else if (e.key === 'Tab') onCommit({ dc: e.shiftKey ? -1 : 1, dr: 0 });
    else if (e.key === 'Escape') onCancel();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const selOwner = result.spillOwner(selection.col, selection.row);
  const selKey = cellKey(selection.col, selection.row);
  const activeSpill = result.spills.find(
    (s) => !s.blocked && (s.anchor === selOwner || s.anchor === selKey),
  );

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Worksheet"
      aria-rowcount={ROWS + 1}
      aria-colcount={COLS + 1}
      aria-activedescendant={`dl-cell-${selKey}`}
      tabIndex={0}
      onKeyDown={onGridKey}
      className="min-h-0 flex-1 overflow-auto bg-tool-canvas outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <div role="row" aria-rowindex={1} className="sticky top-0 z-10 flex">
        <div
          role="columnheader"
          className="sticky left-0 z-20 w-10 shrink-0 border-r border-b border-tool-grid bg-surface-2"
        />
        {Array.from({ length: COLS }, (_, c) => (
          <div
            key={c}
            role="columnheader"
            className={cn(
              WIDTHS[c],
              'shrink-0 border-r border-b border-tool-grid bg-surface-2 py-0.5 text-center text-xs text-fg-muted',
              c === selection.col && 'bg-tool-select text-fg',
            )}
          >
            {colName(c)}
          </div>
        ))}
      </div>
      {Array.from({ length: ROWS }, (_, r) => (
        <div key={r} role="row" aria-rowindex={r + 2} className="flex">
          <div
            role="rowheader"
            className={cn(
              'sticky left-0 z-10 w-10 shrink-0 border-r border-b border-tool-grid bg-surface-2 py-0.5 pr-1 text-right text-xs text-fg-muted',
              r === selection.row && 'bg-tool-select text-fg',
            )}
          >
            {r + 1}
          </div>
          {Array.from({ length: COLS }, (_, c) => {
            const key = cellKey(c, r);
            const v = result.value(c, r);
            const selected = c === selection.col && r === selection.row;
            const owner = result.spillOwner(c, r);
            const inActive =
              activeSpill &&
              r >= activeSpill.row &&
              r < activeSpill.row + activeSpill.rows &&
              c >= activeSpill.col &&
              c < activeSpill.col + activeSpill.cols;
            const isFormula = raw(key).trim().startsWith('=');
            return (
              <div
                key={c}
                id={`dl-cell-${key}`}
                role="gridcell"
                aria-selected={selected}
                aria-label={`${key} ${display(v)}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect({ col: c, row: r });
                  gridRef.current?.focus();
                }}
                onDoubleClick={() => onStartEdit()}
                title={v.kind === 'error' ? v.message : undefined}
                className={cn(
                  WIDTHS[c],
                  'relative h-6 shrink-0 cursor-cell overflow-hidden border-r border-b border-tool-grid px-1 text-xs leading-6 whitespace-nowrap',
                  alignRight(v) && 'text-right tabular-nums',
                  v.kind === 'error' && 'text-tool-alarm-hi',
                  owner && owner !== key && 'text-fg-muted',
                  inActive && 'bg-primary-soft',
                  isFormula && r === 0 && 'font-medium',
                  selected && 'outline-2 -outline-offset-2 outline-primary',
                )}
              >
                {selected && editing ? (
                  <input
                    ref={editorRef}
                    aria-label={`Edit ${key}`}
                    value={draft}
                    onChange={(e) => onDraft(e.target.value)}
                    onKeyDown={onEditorKey}
                    onBlur={() => onCommit({ dc: 0, dr: 0 })}
                    className="absolute inset-0 z-10 w-[max(100%,24rem)] border border-primary bg-surface px-1 font-mono text-xs text-fg outline-none"
                  />
                ) : (
                  display(v)
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
