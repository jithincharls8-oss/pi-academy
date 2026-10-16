import { useMemo, useState } from 'react';
import { summariseLearner, type LearnerSummary } from '@/core/progress/learner';
import { localDate } from '@/lib/id';
import { useApp } from './AppContext';

/** Streak, XP, quests and reviews due, re-read after every database write. */
export function useLearner(): LearnerSummary {
  const { user, rev } = useApp();
  const [today] = useState(() => localDate());
  return useMemo(() => {
    void rev;
    return summariseLearner({
      today,
      attempts: user.attempts(),
      lessons: user.lessonProgress(),
      daily: user.dailyLog(),
      srsDue: user.srsCards().map((c) => c.due_date),
    });
  }, [user, rev, today]);
}
