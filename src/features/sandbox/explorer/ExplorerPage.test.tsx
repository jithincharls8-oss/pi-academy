// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorerPage } from './ExplorerPage';

beforeAll(() => {
  class RO {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('ExplorerPage', () => {
  it('shows live attributes, evaluates an example analysis and checks edits in', async () => {
    const user = userEvent.setup();
    render(<ExplorerPage />);
    const grid = screen.getByRole('grid', { name: 'Attributes of P-101' });
    expect(within(grid).getByText('Rated Flow')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Analyses' }));
    await user.click(screen.getByRole('button', { name: /Evaluate/ }));
    expect(screen.queryAllByText('Not evaluated')).toHaveLength(0);

    await user.click(screen.getByRole('tab', { name: 'General' }));
    const desc = screen.getByLabelText('Description');
    await user.clear(desc);
    await user.type(desc, 'Feed pump A, new seal{Enter}');
    expect(screen.getAllByText('Checked out by you').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /^Check In/ })[0]!);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Check In/ }));
    expect(screen.queryByText('Checked out by you')).not.toBeInTheDocument();
    expect(screen.getByText(/Last check-in/)).toBeInTheDocument();
  });

  it('opens the Library and Event Frames sections', async () => {
    const user = userEvent.setup();
    render(<ExplorerPage />);
    await user.click(screen.getByRole('button', { name: 'Library' }));
    expect(screen.getByRole('heading', { name: /Pump/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Event Frames' }));
    expect(screen.getByRole('heading', { name: 'Event Frame Search' })).toBeInTheDocument();
    expect(screen.getByText(/Results \(\d+\)/)).toBeInTheDocument();
  });
});
