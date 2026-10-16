// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Question } from '@/core/schemas';
import { XP_RULES } from '@/core/progress/learner';
import { QuestionCard } from './QuestionCard';

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({ library: { source: [] }, settings: { onlineFeatures: false } }),
}));

afterEach(cleanup);

const mcq: Question = {
  id: 'q-mcq',
  domain: 'asset-framework',
  coverage: ['da.points'],
  difficulty: 1,
  prompt: 'Pick the AF object that groups attributes.',
  explanation: 'Elements hold attributes in Asset Framework.',
  tags: [],
  sources: [],
  verify: false,
  type: 'mcq',
  options: [
    { id: 'a', text: 'Element' },
    { id: 'b', text: 'Point' },
    { id: 'c', text: 'Table' },
  ],
  answer: 'a',
};

function renderCard(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <QuestionCard question={mcq} keyboard {...props} />
    </MemoryRouter>,
  );
}

describe('QuestionCard', () => {
  it('picks an option with a number key, checks with Enter and celebrates a correct answer', async () => {
    const user = userEvent.setup();
    const onAnswered = vi.fn();
    const onContinue = vi.fn();
    renderCard({ onAnswered, onContinue });
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    await user.keyboard('1');
    expect(screen.getByRole('radio', { name: /Element/ })).toBeChecked();
    await user.keyboard('{Enter}');
    expect(onAnswered).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true }),
      expect.objectContaining({ choice: 'a' }),
    );
    const sheet = screen.getByRole('status');
    expect(sheet).toHaveTextContent('Correct!');
    expect(sheet).toHaveTextContent(`+${XP_RULES.correctAnswer} XP`);
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont).toHaveFocus();
    await user.click(cont);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('shows the correct answer and explanation when the answer is wrong', async () => {
    const user = userEvent.setup();
    renderCard({ onContinue: () => undefined });
    await user.click(screen.getByRole('radio', { name: /Table/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    const sheet = screen.getByRole('status');
    expect(sheet).toHaveTextContent('Not quite');
    expect(sheet).toHaveTextContent('Correct answer: Element');
    expect(sheet).toHaveTextContent('Elements hold attributes');
    expect(sheet).not.toHaveTextContent('XP');
  });

  it('hides the verdict in mock mode', async () => {
    const user = userEvent.setup();
    renderCard({ showFeedback: false });
    await user.keyboard('2');
    await user.click(screen.getByRole('button', { name: 'Save answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Answer saved.');
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument();
  });
});
