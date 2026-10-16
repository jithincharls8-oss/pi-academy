// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayEditor } from './DisplayEditor';
import { EXAMPLES } from './examples';
import { emptyDisplay } from './model';

const saved: { name: string; data: string; id?: string }[] = [];
vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    user: {
      saveDisplay: (_tool: string, name: string, data: string, id?: string) => {
        saved.push({ name, data, id });
        return id ?? 'd_test';
      },
      savedDisplays: () => [],
      deleteDisplay: () => undefined,
    },
    flush: async () => undefined,
    rev: 0,
  }),
}));

beforeAll(() => {
  class RO {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('DisplayEditor', () => {
  for (const ex of EXAMPLES) {
    it(`renders ${ex.name} in view and design mode`, async () => {
      const user = userEvent.setup();
      render(
        <DisplayEditor
          initial={ex.build()}
          savedId={null}
          startInDesign={false}
          onHome={() => undefined}
        />,
      );
      expect(screen.getByRole('heading', { name: ex.name })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'View mode' }));
      expect(screen.getByRole('region', { name: /design mode/ })).toBeInTheDocument();
    });
  }

  it('switches asset on an asset-relative display', async () => {
    const user = userEvent.setup();
    const d = EXAMPLES[0]?.build();
    if (!d) throw new Error('no example');
    render(
      <DisplayEditor initial={d} savedId={null} startInDesign={false} onHome={() => undefined} />,
    );
    await user.selectOptions(
      screen.getByLabelText('Switch asset'),
      screen.getByRole('option', { name: /P-102/ }),
    );
    expect(screen.getAllByText(/P-102 Flow/).length).toBeGreaterThan(0);
  });

  it('adds a symbol from the Assets pane, moves it with the keyboard and saves', async () => {
    const user = userEvent.setup();
    render(
      <DisplayEditor
        initial={emptyDisplay('')}
        savedId={null}
        startInDesign
        onHome={() => undefined}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'Value' }));
    const list = screen.getByRole('list', { name: 'Attributes of P-101' });
    await user.click(within(list).getByRole('button', { name: 'Add P-101 Flow to the display' }));
    const sym = screen.getByRole('group', { name: /Value: P-101 Flow, selected/ });
    const left = sym.style.left;
    sym.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('group', { name: /Value: P-101 Flow/ }).style.left).not.toBe(left);
    // the first drop of a templated element enables asset switching
    expect(screen.getByLabelText('Switch asset')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save (Ctrl+S)' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Display name'), 'My pump');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(saved.at(-1)?.name).toBe('My pump');
    expect(screen.getByRole('button', { name: 'View mode' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View mode' }));
    const g = screen.getByRole('group', { name: /Value: P-101 Flow/ });
    g.focus();
    await user.keyboard('{Delete}');
    expect(screen.queryByRole('group', { name: /Value: P-101 Flow/ })).not.toBeInTheDocument();
  });
});
