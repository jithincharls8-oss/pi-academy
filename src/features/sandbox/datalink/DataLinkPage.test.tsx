// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataLinkPage } from './DataLinkPage';

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    rev: 0,
    user: {
      savedDisplays: () => [],
      saveDisplay: () => 'd_1',
      deleteDisplay: () => undefined,
    },
  }),
}));

afterEach(cleanup);

describe('DataLinkPage', () => {
  it('edits cells with the keyboard and inserts a function from the wizard', async () => {
    const user = userEvent.setup();
    render(<DataLinkPage />);
    const grid = screen.getByRole('grid', { name: 'Worksheet' });
    grid.focus();
    // From B4 go to K30 (empty) with the arrow keys and type a formula.
    await user.keyboard('{ArrowDown>26}{ArrowRight>9}');
    expect(screen.getByLabelText('Selected cell')).toHaveTextContent('K30');
    await user.keyboard('=2*21{Enter}');
    expect(screen.getByRole('gridcell', { name: 'K30 42' })).toBeInTheDocument();
    expect(screen.getByLabelText('Selected cell')).toHaveTextContent('K31');

    await user.click(screen.getByRole('button', { name: /Function wizard/ }));
    await user.selectOptions(screen.getByLabelText('Function'), 'PICurrVal');
    await user.click(screen.getByRole('button', { name: 'Insert into K31' }));
    expect(screen.getByLabelText('Formula bar for K31')).toHaveValue(
      '=PICurrVal("RB.P101.FLOW",0)',
    );
  });
});
