import { useState } from 'react';
import { DisplayEditor } from './DisplayEditor';
import { DisplayHome } from './DisplayHome';
import { emptyDisplay, type Display } from './model';

type View =
  | { mode: 'home' }
  | { mode: 'display'; display: Display; savedId: string | null; design: boolean; key: number };

/** PI Vision style display mockup: the display list, and an open display in view or design mode. */
export function VisionPage() {
  const [view, setView] = useState<View>({ mode: 'home' });
  const [seq, setSeq] = useState(0);
  const open = (display: Display, savedId: string | null, design: boolean): void => {
    setSeq((n) => n + 1);
    setView({ mode: 'display', display, savedId, design, key: seq + 1 });
  };
  if (view.mode === 'home') {
    return (
      <DisplayHome
        onOpen={(d, id) => open(d, id, false)}
        onNew={() => open(emptyDisplay(''), null, true)}
      />
    );
  }
  return (
    <DisplayEditor
      key={view.key}
      initial={view.display}
      savedId={view.savedId}
      startInDesign={view.design}
      onHome={() => setView({ mode: 'home' })}
    />
  );
}
