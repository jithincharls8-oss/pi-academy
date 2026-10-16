import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, FolderOpen, Info, RefreshCw, Save, Sigma, Trash2 } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import { ToolFrame } from '../shared/ToolFrame';
import { Grid, type Selection } from './Grid';
import { FunctionWizard } from './FunctionWizard';
import { evaluateSheet, COLS, ROWS, type Cells } from './sheet';
import { cellKey, functionNames, parseFormula } from './formula';
import { specFor } from './specs';
import { pumpReport } from './example';
import { display } from './values';

const TOOL = 'datalink';

function parseSaved(data: string): Cells | null {
  try {
    const v: unknown = JSON.parse(data);
    if (!v || typeof v !== 'object') return null;
    const out: Cells = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'string' && /^[A-L]([1-9]|[1-3]\d|40)$/.test(k)) out[k] = val;
    }
    return out;
  } catch {
    return null;
  }
}

/** A PI DataLink style worksheet: DataLink functions as live, spilling formulas. */
export function DataLinkPage() {
  const { user, rev } = useApp();
  const [cells, setCells] = useState<Cells>(() => pumpReport());
  const [now, setNow] = useState(() => Date.now());
  const [auto, setAuto] = useState(false);
  const [sel, setSel] = useState<Selection>({ col: 1, row: 3 });
  const [editing, setEditingState] = useState<'none' | 'cell' | 'bar'>('none');
  const [draft, setDraft] = useState('');
  const [wizard, setWizard] = useState(false);
  const [sheetName, setSheetName] = useState('Pump report');
  const [savedId, setSavedId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef<'none' | 'cell' | 'bar'>('none');
  const setEditing = useCallback((m: 'none' | 'cell' | 'bar') => {
    editingRef.current = m;
    setEditingState(m);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(t);
  }, [auto]);

  const result = useMemo(() => evaluateSheet(cells, { now }), [cells, now]);
  const key = cellKey(sel.col, sel.row);
  const raw = cells[key] ?? '';
  const value = result.value(sel.col, sel.row);
  const owner = result.spillOwner(sel.col, sel.row);

  const saved = useMemo(() => {
    void rev;
    return user.savedDisplays(TOOL);
  }, [user, rev]);

  const select = useCallback(
    (s: Selection) => {
      setSel(s);
      setEditing('none');
    },
    [setEditing],
  );

  const writeCell = (k: string, text: string): void => {
    setCells((c) => {
      const rest = Object.fromEntries(Object.entries(c).filter(([x]) => x !== k));
      return text === '' ? rest : { ...rest, [k]: text };
    });
    setNow(Date.now());
  };

  const commit = (mv: { dc: number; dr: number }): void => {
    if (editingRef.current === 'none') return;
    writeCell(key, draft);
    setEditing('none');
    setSel({
      col: Math.max(0, Math.min(COLS - 1, sel.col + mv.dc)),
      row: Math.max(0, Math.min(ROWS - 1, sel.row + mv.dr)),
    });
    gridRef.current?.focus();
  };
  const cancel = (): void => {
    setEditing('none');
    gridRef.current?.focus();
  };
  const startEdit = (initial?: string): void => {
    setDraft(initial ?? raw);
    setEditing('cell');
  };
  const recalc = (): void => setNow(Date.now());

  const fnInfo = useMemo(() => {
    const src = (owner ? (cells[owner] ?? '') : raw).trim();
    if (!src.startsWith('=')) return [];
    try {
      return functionNames(parseFormula(src.slice(1)))
        .map((n) => specFor(n))
        .filter((s) => s !== undefined);
    } catch {
      return [];
    }
  }, [owner, cells, raw]);

  const save = (): void => {
    const name = sheetName.trim() || 'Untitled sheet';
    const existing = saved.find((s) => s.name === name);
    const id = user.saveDisplay(TOOL, name, JSON.stringify(cells), existing?.id ?? undefined);
    setSavedId(id);
  };
  const load = (id: string): void => {
    const row = saved.find((s) => s.id === id);
    const c = row ? parseSaved(row.data) : null;
    if (!row || !c) return;
    setCells(c);
    setSheetName(row.name);
    setSavedId(row.id);
    setNow(Date.now());
  };

  const formulaBarValue = editing === 'none' ? raw : draft;
  const selectedSpill = result.spills.find((s) => s.anchor === key);

  const toolbar = (
    <>
      <Button size="sm" onClick={() => setWizard(true)}>
        <Sigma aria-hidden /> Function wizard
      </Button>
      <Button size="sm" variant="secondary" onClick={recalc} aria-keyshortcuts="F9">
        <RefreshCw aria-hidden /> Recalculate (F9)
      </Button>
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <Switch
          checked={auto}
          onCheckedChange={setAuto}
          aria-label="Recalculate every 10 seconds"
        />
        Auto every 10 s
      </label>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setCells(pumpReport());
          setSheetName('Pump report');
          setSavedId(null);
          setNow(Date.now());
        }}
      >
        <FileSpreadsheet aria-hidden /> Load pump report
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setCells({});
          setSavedId(null);
          setSheetName('Untitled sheet');
        }}
      >
        <Trash2 aria-hidden /> Clear sheet
      </Button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden />
      <Label htmlFor="dl-name" className="sr-only">
        Sheet name
      </Label>
      <Input
        id="dl-name"
        value={sheetName}
        onChange={(e) => setSheetName(e.target.value)}
        className="h-8 w-40 text-xs"
      />
      <Button size="sm" variant="secondary" onClick={save}>
        <Save aria-hidden /> Save
      </Button>
      {saved.length ? (
        <>
          <Label htmlFor="dl-open" className="sr-only">
            Open a saved sheet
          </Label>
          <FolderOpen className="size-4 text-fg-muted" aria-hidden />
          <Select
            id="dl-open"
            value={savedId ?? ''}
            onChange={(e) => load(e.target.value)}
            className="h-8 w-44 text-xs"
          >
            <option value="" disabled>
              Open saved sheet…
            </option>
            {saved.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {savedId ? (
            <Button
              size="sm"
              variant="ghost"
              aria-label="Delete the open saved sheet"
              onClick={() => {
                user.deleteDisplay(savedId);
                setSavedId(null);
              }}
            >
              <Trash2 aria-hidden />
            </Button>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <ToolFrame
        title="PI DataLink worksheet"
        menu={['File', 'Home', 'Insert', 'Formulas', 'Data', 'PI DataLink']}
        toolbar={toolbar}
        status={
          <span>
            {key}
            {owner && owner !== key ? ` · spilled from ${owner}` : ''}
            {selectedSpill
              ? selectedSpill.blocked
                ? ' · spill blocked'
                : ` · spills ${selectedSpill.rows} × ${selectedSpill.cols}`
              : ''}
            {' · '}Calculated {new Date(now).toLocaleTimeString()} · Arrow keys move, type or F2 to
            edit, Enter commits, Delete clears, F9 recalculates
          </span>
        }
        className="min-h-[40rem]"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-tool-grid bg-surface px-2 py-1">
            <span
              className="w-14 rounded border border-border bg-surface-2 px-1 py-0.5 text-center font-mono text-xs"
              aria-label="Selected cell"
            >
              {key}
            </span>
            <button
              type="button"
              onClick={() => setWizard(true)}
              className="rounded px-1 font-serif text-sm text-fg-muted italic hover:bg-surface-2"
              aria-label="Insert function"
            >
              fx
            </button>
            <label htmlFor="dl-formula" className="sr-only">
              Formula bar for {key}
            </label>
            <input
              id="dl-formula"
              value={formulaBarValue}
              onFocus={() => {
                if (editing === 'none') {
                  setDraft(raw);
                  setEditing('bar');
                }
              }}
              onChange={(e) => {
                setDraft(e.target.value);
                if (editing === 'none') setEditing('bar');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit({ dc: 0, dr: 0 });
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              onBlur={() => {
                if (editingRef.current === 'bar') commit({ dc: 0, dr: 0 });
              }}
              spellCheck={false}
              className="h-7 min-w-0 flex-1 rounded border border-border bg-surface px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <Grid
            result={result}
            raw={(k) => cells[k] ?? ''}
            selection={sel}
            onSelect={select}
            editing={editing === 'cell'}
            draft={draft}
            onDraft={setDraft}
            onStartEdit={startEdit}
            onCommit={commit}
            onCancel={cancel}
            onClear={() => writeCell(key, '')}
            onRecalc={recalc}
            gridRef={gridRef}
          />
        </div>
        <aside
          className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-tool-grid bg-surface p-3 text-xs lg:flex"
          aria-label="Cell inspector"
        >
          <h2 className="text-sm font-semibold">Cell {key}</h2>
          <dl className="grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1">
            <dt className="text-fg-muted">Input</dt>
            <dd className="font-mono break-all">
              {raw || (owner ? `(spilled from ${owner})` : '(empty)')}
            </dd>
            <dt className="text-fg-muted">Value</dt>
            <dd className="break-all">{display(value) || '(empty)'}</dd>
            <dt className="text-fg-muted">Type</dt>
            <dd>
              {value.kind === 'error'
                ? `error ${value.code === 'PI' ? '(DataLink message)' : value.code}`
                : value.kind}
            </dd>
          </dl>
          {value.kind === 'error' ? (
            <p role="status" className="rounded bg-danger-soft px-2 py-1 text-danger">
              {value.message}
            </p>
          ) : null}
          {fnInfo.map((s) => (
            <div key={s.name} className="rounded border border-border p-2">
              <div className="font-mono font-medium">
                {s.name}({s.args.map((a) => a.name).join(', ')})
              </div>
              <p className="mt-1 text-fg-muted">{s.summary}</p>
              {s.simplified ? (
                <p
                  className="mt-1 flex items-start gap-1 text-warning"
                  title={`Simplified: ${s.simplified}`}
                >
                  <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
                  <span>Simplified: {s.simplified}</span>
                </p>
              ) : null}
            </div>
          ))}
          <div className="mt-auto border-t border-border pt-2 text-fg-muted">
            <p>
              Functions: PICurrVal, PIArcVal, PIExpVal, PICompDat, PINCompDat, PISampDat, PITimeDat,
              PIAdvCalcVal, PIAdvCalcDat, plus SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS, IF, NOW,
              CONCAT and the operators + − * / ^ &amp; and comparisons.
            </p>
            <p className="mt-2">
              Arrays spill like dynamic-array formulas; typed content in the way shows #SPILL!. Real
              DataLink also writes fixed-size array formulas and offers “Resize” when more values
              arrive.
            </p>
          </div>
        </aside>
      </ToolFrame>
      <FunctionWizard
        open={wizard}
        onOpenChange={(o) => {
          setWizard(o);
          if (!o) window.setTimeout(() => gridRef.current?.focus(), 0);
        }}
        target={key}
        cells={cells}
        now={now}
        onInsert={(f) => writeCell(key, f)}
      />
    </div>
  );
}
