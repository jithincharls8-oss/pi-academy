import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, Label, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { buildFormula, FUNCTION_SPECS, type FunctionSpec } from './specs';
import { evaluateSheet, type Cells } from './sheet';
import { parseAddr } from './formula';
import { display } from './values';

/**
 * Function wizard: pick a DataLink function, fill its arguments (each described as in the
 * DataLink guide), preview the result and insert the formula into the selected cell.
 */
export function FunctionWizard({
  open,
  onOpenChange,
  target,
  cells,
  now,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  target: string;
  cells: Cells;
  now: number;
  onInsert: (formula: string) => void;
}) {
  const [name, setName] = useState('PICompDat');
  const spec = FUNCTION_SPECS.find((f) => f.name === name) as FunctionSpec;
  const [values, setValues] = useState<Record<string, string[]>>({});
  const current = values[name] ?? spec.args.map((a) => a.example);
  const formula = buildFormula(spec, current);

  const set = (i: number, v: string): void => {
    const next = [...current];
    next[i] = v;
    setValues({ ...values, [name]: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Insert DataLink function"
        description={`The formula goes into cell ${target}. Text arguments are quoted for you; cell references such as A4 or $H$1 are left as they are.`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fw-fn">Function</Label>
            <Select id="fw-fn" value={name} onChange={(e) => setName(e.target.value)}>
              {(['Single value', 'Multiple value', 'Calculation', 'Excel'] as const).map((g) => (
                <optgroup key={g} label={g}>
                  {FUNCTION_SPECS.filter((f) => f.group === g).map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <p className="text-sm text-fg-muted">
              {spec.summary} {spec.spills ? <Badge tone="info">spills an array</Badge> : null}
            </p>
            {spec.simplified ? (
              <p className="flex items-start gap-1 rounded bg-warning-soft px-2 py-1 text-xs text-warning">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  <strong>Simplified:</strong> {spec.simplified}
                </span>
              </p>
            ) : null}
          </div>
          <code className="block rounded bg-surface-2 px-2 py-1 font-mono text-xs">
            {spec.name}({spec.args.map((a) => a.name).join(', ')})
          </code>
          <div className="grid gap-3">
            {spec.args.map((a, i) => {
              const id = `fw-${spec.name}-${a.name}`;
              return (
                <div key={a.name} className="grid gap-1">
                  <Label htmlFor={id} className="font-mono text-xs">
                    {a.name}
                    {a.optional ? (
                      <span className="font-sans text-fg-muted"> (optional)</span>
                    ) : null}
                  </Label>
                  <Input
                    id={id}
                    value={current[i] ?? ''}
                    onChange={(e) => set(i, e.target.value)}
                    aria-describedby={`${id}-d`}
                    list={a.choices ? `${id}-l` : undefined}
                    className="h-8 font-mono text-xs"
                  />
                  {a.choices ? (
                    <datalist id={`${id}-l`}>
                      {a.choices.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  ) : null}
                  <p id={`${id}-d`} className="text-xs text-fg-muted">
                    {a.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="rounded border border-border bg-surface-2 p-2 text-xs">
            <div className="font-mono break-all">{formula}</div>
            <div className="mt-1 text-fg-muted" aria-live="polite">
              Result:{' '}
              {open ? <Preview cells={cells} target={target} formula={formula} now={now} /> : null}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onInsert(formula);
                onOpenChange(false);
              }}
            >
              Insert into {target}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Preview({
  cells,
  target,
  formula,
  now,
}: {
  cells: Cells;
  target: string;
  formula: string;
  now: number;
}) {
  const text = useMemo(() => {
    const a = parseAddr(target);
    if (!a) return '';
    const r = evaluateSheet({ ...cells, [target]: formula }, { now });
    const v = r.value(a.col, a.row);
    const area = r.spills.find((s) => s.anchor === target);
    const size = area && !area.blocked ? ` (spills ${area.rows} × ${area.cols})` : '';
    return v.kind === 'error' && v.code !== 'PI'
      ? `${v.code} ${v.message}`
      : `${display(v)}${size}`;
  }, [cells, target, formula, now]);
  return <span className="text-fg">{text}</span>;
}
