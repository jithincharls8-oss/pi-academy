// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmtPage } from './SmtPage';

beforeAll(() => {
  class RO {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('SmtPage', () => {
  it('edits a point in Point Builder, blocks invalid input and logs the change', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('button', { name: 'RB.P101.FLOW' }));
    await user.click(screen.getByRole('tab', { name: 'Archive' }));
    const compdev = screen.getByLabelText('CompDev (eng. units)');
    await user.clear(compdev);
    await user.type(compdev, '-1');
    expect(screen.getByText('CompDev cannot be negative')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
    await user.clear(compdev);
    await user.type(compdev, '2');
    await user.click(screen.getByRole('button', { name: /Apply/ }));
    expect(screen.getByText(/Saved to the sandbox/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Message Logs' }));
    expect(screen.getByText(/Point edited: RB.P101.FLOW \[compdev\]/)).toBeInTheDocument();
  });

  it('requires a digital set for digital points', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('button', { name: 'RB.P101.FLOW' }));
    await user.selectOptions(screen.getByLabelText('Point type'), 'Digital');
    expect(screen.getByText('A digital point needs a digital set')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Digital set'), 'PumpStatus');
    expect(screen.queryByText('A digital point needs a digital set')).not.toBeInTheDocument();
  });

  it('runs piconfig in the console and shows the result in the SMT tools', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('tab', { name: /Command prompt/ }));
    const input = screen.getByRole('textbox');
    for (const line of [
      'piconfig',
      '@table pipoint',
      '@mode edit',
      '@istr tag,descriptor',
      'RB.K100.KW,Compressor power',
      '@exit',
      'piartool -as',
    ]) {
      await user.type(input, `${line}{Enter}`);
    }
    const log = screen.getByRole('log');
    expect(within(log).getByText('* Edited RB.K100.KW: descriptor')).toBeInTheDocument();
    expect(within(log).getByText(/Archiving Flag/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'System Management Tools' }));
    await user.click(screen.getByRole('button', { name: 'Current Values' }));
    expect(screen.getByText('Compressor power')).toBeInTheDocument();
  });

  it('forces an archive shift and resets the sandbox', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('button', { name: 'Archives' }));
    await user.click(screen.getByRole('button', { name: /Force archive shift/ }));
    await user.click(screen.getByRole('button', { name: 'Shift' }));
    const table = screen.getByRole('table', { name: 'Historic archives' });
    expect(within(table).getByText(/created by a forced shift/)).toBeInTheDocument();
    expect(within(table).getByText(/ended by a forced shift/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reset sandbox/ }));
    expect(
      within(screen.getByRole('table', { name: 'Historic archives' })).queryByText(/forced shift/),
    ).toBeNull();
  });

  it('adds an annotated value in the Archive Editor and edits a tuning parameter', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('button', { name: 'Archive Editor' }));
    await user.click(screen.getByRole('button', { name: /Add value/ }));
    await user.type(screen.getByLabelText('Value'), '123.5');
    await user.type(screen.getByLabelText('Annotation'), 'Lab check');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    // The default time can land on an archived event's timestamp, which shows as a replace.
    expect(screen.getAllByText(/^(Added|Replaced) \(sandbox\)$/).length).toBe(1);
    expect(screen.getAllByText('Lab check').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Tuning Parameters' }));
    const field = screen.getByLabelText('ArcMaxCollect');
    await user.clear(field);
    await user.type(field, '2000000{Enter}');
    expect(screen.getByText(/Restart required/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Restart PI Archive Subsystem/ }));
    expect(screen.queryByText(/Restart required/)).toBeNull();
  });

  it('disconnects the tools when the server is unticked', async () => {
    const user = userEvent.setup();
    render(<SmtPage />);
    await user.click(screen.getByRole('checkbox', { name: /PISRV01/ }));
    expect(screen.getByText(/No server selected/)).toBeInTheDocument();
  });
});
