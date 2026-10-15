// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CompressionLabPage } from './CompressionLabPage';

afterEach(cleanup);

describe('CompressionLabPage', () => {
  it('applies a preset and steps through the swinging door', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CompressionLabPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Compressing = 0 keeps everything' }));
    expect(screen.getByText(/every snapshot event reaches the archive/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start step-through/ }));
    expect(screen.getByText(/Compressing is 0 \(off\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'CompDev = 0 still drops flat lines' }));
    // Choosing a preset leaves step mode, so start it again.
    await user.click(screen.getByRole('button', { name: /Start step-through/ }));
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/Inside the door|outside the door/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lesson: Exception and compression/ })).toHaveAttribute(
      'href',
      '/learn/exception-and-compression',
    );
  });
});
