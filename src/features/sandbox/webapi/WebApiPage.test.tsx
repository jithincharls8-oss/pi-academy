// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WebApiPage } from './WebApiPage';

const store = new Map<
  string,
  { id: string; tool: string; name: string; data: string; updated_at: string }
>();
vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    rev: store.size,
    user: {
      savedDisplays: (tool: string) => [...store.values()].filter((r) => r.tool === tool),
      saveDisplay: (tool: string, name: string, data: string, id?: string) => {
        const key = id ?? `d_${store.size}`;
        store.set(key, { id: key, tool, name, data, updated_at: '' });
        return key;
      },
      deleteDisplay: (id: string) => store.delete(id),
    },
  }),
}));

afterEach(cleanup);

describe('WebApiPage', () => {
  it('sends a request, follows a link and solves the WebID challenge', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <WebApiPage />
      </MemoryRouter>,
    );
    const url = screen.getByLabelText('Request URL');
    await user.clear(url);
    await user.type(url, '/piwebapi/points?path=\\\\PISRV01\\RB.P102.FLOW');
    expect(screen.getByLabelText('Parameter 1 value')).toHaveValue('\\\\PISRV01\\RB.P102.FLOW');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(screen.getByText(/HTTP\/1.1 200 OK/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Find the WebID of RB.P102.FLOW');
    await user.click(screen.getAllByRole('button', { name: /Decode WebID/ })[0]!);
    expect((screen.getByLabelText('WebID to decode') as HTMLInputElement).value).toMatch(/^P1DP/);
    expect(screen.getAllByText('PI Point').length).toBeGreaterThan(0);
    await user.click(screen.getByTitle(/Load \/piwebapi\/streams\/.*\/value/));
    expect((screen.getByLabelText('Request URL') as HTMLInputElement).value).toMatch(/\/value$/);
  });
});
