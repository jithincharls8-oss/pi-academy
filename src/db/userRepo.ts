import type { Domain } from '@/core/schemas';
import { newId } from '@/lib/id';
import type { AppDatabase } from './database';

export interface LessonProgressRow {
  lesson_id: string;
  status: 'started' | 'completed';
  completed_at: string | null;
  last_viewed_at: string;
}
export interface BookmarkRow {
  kind: string;
  item_id: string;
  created_at: string;
}
export interface NoteRow {
  id: string;
  lesson_id: string;
  body: string;
  updated_at: string;
}
export interface AttemptRow {
  id: string;
  question_id: string;
  domain: Domain;
  mode: ExamMode;
  correct: number;
  score: number;
  answer: string;
  answered_at: string;
  session_id: string | null;
}
export type ExamMode = 'daily' | 'quiz' | 'mock' | 'review' | 'lesson';
export interface ExamSessionRow {
  id: string;
  mode: ExamMode;
  seed: string;
  date: string;
  question_ids: string;
  started_at: string;
  finished_at: string | null;
  score: number | null;
  time_limit_s: number | null;
}
export interface SrsRow {
  question_id: string;
  easiness: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_review: string;
}
export interface FlagRow {
  id: string;
  kind: string;
  item_id: string;
  note: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}
export interface SavedDisplayRow {
  id: string;
  tool: string;
  name: string;
  data: string;
  updated_at: string;
}

const now = (): string => new Date().toISOString();

export class UserRepo {
  constructor(private readonly db: AppDatabase) {}

  /* lessons */
  lessonProgress(): LessonProgressRow[] {
    return this.db.all<LessonProgressRow>('SELECT * FROM lesson_progress');
  }
  markLessonViewed(lessonId: string): void {
    this.db.run(
      `INSERT INTO lesson_progress (lesson_id, status, completed_at, last_viewed_at) VALUES (?, 'started', NULL, ?)
       ON CONFLICT(lesson_id) DO UPDATE SET last_viewed_at = excluded.last_viewed_at`,
      [lessonId, now()],
    );
  }
  setLessonCompleted(lessonId: string, completed: boolean): void {
    const t = now();
    this.db.run(
      `INSERT INTO lesson_progress (lesson_id, status, completed_at, last_viewed_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(lesson_id) DO UPDATE SET status = excluded.status, completed_at = excluded.completed_at`,
      [lessonId, completed ? 'completed' : 'started', completed ? t : null, t],
    );
  }

  /* bookmarks */
  bookmarks(): BookmarkRow[] {
    return this.db.all<BookmarkRow>('SELECT * FROM bookmarks ORDER BY created_at DESC');
  }
  isBookmarked(kind: string, itemId: string): boolean {
    return !!this.db.get('SELECT 1 AS x FROM bookmarks WHERE kind = ? AND item_id = ?', [
      kind,
      itemId,
    ]);
  }
  toggleBookmark(kind: string, itemId: string): boolean {
    if (this.isBookmarked(kind, itemId)) {
      this.db.run('DELETE FROM bookmarks WHERE kind = ? AND item_id = ?', [kind, itemId]);
      return false;
    }
    this.db.run('INSERT INTO bookmarks (kind, item_id, created_at) VALUES (?, ?, ?)', [
      kind,
      itemId,
      now(),
    ]);
    return true;
  }

  /* notes */
  notes(lessonId?: string): NoteRow[] {
    return lessonId
      ? this.db.all<NoteRow>('SELECT * FROM notes WHERE lesson_id = ? ORDER BY updated_at DESC', [
          lessonId,
        ])
      : this.db.all<NoteRow>('SELECT * FROM notes ORDER BY updated_at DESC');
  }
  saveNote(lessonId: string, body: string, id?: string): string {
    const noteId = id ?? newId('n_');
    this.db.run(
      `INSERT INTO notes (id, lesson_id, body, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
      [noteId, lessonId, body, now()],
    );
    return noteId;
  }
  deleteNote(id: string): void {
    this.db.run('DELETE FROM notes WHERE id = ?', [id]);
  }

  /* exams */
  createSession(s: Omit<ExamSessionRow, 'id' | 'started_at' | 'finished_at' | 'score'>): string {
    const id = newId('s_');
    this.db.run(
      'INSERT INTO exam_sessions (id, mode, seed, date, question_ids, started_at, finished_at, score, time_limit_s) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)',
      [id, s.mode, s.seed, s.date, s.question_ids, now(), s.time_limit_s],
    );
    return id;
  }
  finishSession(id: string, score: number): void {
    this.db.run('UPDATE exam_sessions SET finished_at = ?, score = ? WHERE id = ?', [
      now(),
      score,
      id,
    ]);
  }
  sessions(mode?: ExamMode): ExamSessionRow[] {
    return mode
      ? this.db.all<ExamSessionRow>(
          'SELECT * FROM exam_sessions WHERE mode = ? ORDER BY started_at DESC',
          [mode],
        )
      : this.db.all<ExamSessionRow>('SELECT * FROM exam_sessions ORDER BY started_at DESC');
  }
  session(id: string): ExamSessionRow | undefined {
    return this.db.get<ExamSessionRow>('SELECT * FROM exam_sessions WHERE id = ?', [id]);
  }
  recordAttempt(a: Omit<AttemptRow, 'id' | 'answered_at'> & { answered_at?: string }): void {
    this.db.run(
      'INSERT INTO attempts (id, question_id, domain, mode, correct, score, answer, answered_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newId('a_'),
        a.question_id,
        a.domain,
        a.mode,
        a.correct,
        a.score,
        a.answer,
        a.answered_at ?? now(),
        a.session_id,
      ],
    );
  }
  attempts(sessionId?: string): AttemptRow[] {
    return sessionId
      ? this.db.all<AttemptRow>(
          'SELECT * FROM attempts WHERE session_id = ? ORDER BY answered_at',
          [sessionId],
        )
      : this.db.all<AttemptRow>('SELECT * FROM attempts ORDER BY answered_at');
  }

  /* daily log */
  logDaily(date: string, score: number): void {
    this.db.run(
      `INSERT INTO daily_log (date, completed, score) VALUES (?, 1, ?)
       ON CONFLICT(date) DO UPDATE SET completed = 1, score = MAX(daily_log.score, excluded.score)`,
      [date, score],
    );
  }
  dailyLog(): { date: string; completed: number; score: number }[] {
    return this.db.all('SELECT * FROM daily_log ORDER BY date');
  }

  /* SRS */
  srsCards(): SrsRow[] {
    return this.db.all<SrsRow>('SELECT * FROM srs_cards');
  }
  srsCard(questionId: string): SrsRow | undefined {
    return this.db.get<SrsRow>('SELECT * FROM srs_cards WHERE question_id = ?', [questionId]);
  }
  saveSrsCard(c: SrsRow): void {
    this.db.run(
      `INSERT INTO srs_cards (question_id, easiness, interval_days, repetitions, due_date, last_review) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(question_id) DO UPDATE SET easiness = excluded.easiness, interval_days = excluded.interval_days,
         repetitions = excluded.repetitions, due_date = excluded.due_date, last_review = excluded.last_review`,
      [c.question_id, c.easiness, c.interval_days, c.repetitions, c.due_date, c.last_review],
    );
  }

  /* verification flags */
  flags(status?: 'open' | 'resolved'): FlagRow[] {
    return status
      ? this.db.all<FlagRow>(
          'SELECT * FROM verification_flags WHERE status = ? ORDER BY created_at DESC',
          [status],
        )
      : this.db.all<FlagRow>('SELECT * FROM verification_flags ORDER BY created_at DESC');
  }
  addFlag(kind: string, itemId: string, note: string): string {
    const id = newId('f_');
    this.db.run(
      "INSERT INTO verification_flags (id, kind, item_id, note, status, created_at, resolved_at) VALUES (?, ?, ?, ?, 'open', ?, NULL)",
      [id, kind, itemId, note, now()],
    );
    return id;
  }
  resolveFlag(id: string): void {
    this.db.run("UPDATE verification_flags SET status = 'resolved', resolved_at = ? WHERE id = ?", [
      now(),
      id,
    ]);
  }

  /* challenges, badges, displays */
  challengeProgress(): { challenge_id: string; status: string; completed_at: string | null }[] {
    return this.db.all('SELECT * FROM challenge_progress');
  }
  setChallenge(challengeId: string, completed: boolean): void {
    this.db.run(
      `INSERT INTO challenge_progress (challenge_id, status, completed_at) VALUES (?, ?, ?)
       ON CONFLICT(challenge_id) DO UPDATE SET status = CASE WHEN challenge_progress.status = 'completed' THEN 'completed' ELSE excluded.status END,
         completed_at = COALESCE(challenge_progress.completed_at, excluded.completed_at)`,
      [challengeId, completed ? 'completed' : 'attempted', completed ? now() : null],
    );
  }
  badges(): { id: string; earned_at: string }[] {
    return this.db.all('SELECT * FROM badges ORDER BY earned_at');
  }
  awardBadge(id: string): boolean {
    if (this.db.get('SELECT 1 AS x FROM badges WHERE id = ?', [id])) return false;
    this.db.run('INSERT INTO badges (id, earned_at) VALUES (?, ?)', [id, now()]);
    return true;
  }
  savedDisplays(tool: string): SavedDisplayRow[] {
    return this.db.all<SavedDisplayRow>(
      'SELECT * FROM saved_displays WHERE tool = ? ORDER BY name',
      [tool],
    );
  }
  saveDisplay(tool: string, name: string, data: string, id?: string): string {
    const displayId = id ?? newId('d_');
    this.db.run(
      `INSERT INTO saved_displays (id, tool, name, data, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data, updated_at = excluded.updated_at`,
      [displayId, tool, name, data, now()],
    );
    return displayId;
  }
  deleteDisplay(id: string): void {
    this.db.run('DELETE FROM saved_displays WHERE id = ?', [id]);
  }
}
