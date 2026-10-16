/** Ordered schema migrations. Never edit a shipped migration; append a new one. */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: `
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE content_items (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        origin TEXT NOT NULL CHECK (origin IN ('bundle','user')),
        data TEXT NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (kind, id, origin)
      );
      CREATE TABLE verification_flags (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        item_id TEXT NOT NULL,
        note TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open','resolved')),
        created_at TEXT NOT NULL,
        resolved_at TEXT
      );
      CREATE TABLE lesson_progress (
        lesson_id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (status IN ('started','completed')),
        completed_at TEXT,
        last_viewed_at TEXT NOT NULL
      );
      CREATE TABLE bookmarks (
        kind TEXT NOT NULL,
        item_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (kind, item_id)
      );
      CREATE TABLE notes (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        body TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE exam_sessions (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        seed TEXT NOT NULL,
        date TEXT NOT NULL,
        question_ids TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        score REAL,
        time_limit_s INTEGER
      );
      CREATE TABLE attempts (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        domain TEXT NOT NULL,
        mode TEXT NOT NULL,
        correct INTEGER NOT NULL,
        score REAL NOT NULL,
        answer TEXT NOT NULL,
        answered_at TEXT NOT NULL,
        session_id TEXT
      );
      CREATE INDEX attempts_question ON attempts(question_id);
      CREATE INDEX attempts_domain ON attempts(domain, answered_at);
      CREATE TABLE srs_cards (
        question_id TEXT PRIMARY KEY,
        easiness REAL NOT NULL,
        interval_days INTEGER NOT NULL,
        repetitions INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        last_review TEXT NOT NULL
      );
      CREATE TABLE daily_log (
        date TEXT PRIMARY KEY,
        completed INTEGER NOT NULL,
        score REAL NOT NULL
      );
      CREATE TABLE challenge_progress (
        challenge_id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (status IN ('attempted','completed')),
        completed_at TEXT
      );
      CREATE TABLE badges (id TEXT PRIMARY KEY, earned_at TEXT NOT NULL);
      CREATE TABLE saved_displays (
        id TEXT PRIMARY KEY,
        tool TEXT NOT NULL,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
];

/** Tables that hold learner data (exported in backups, cleared on reset). */
export const USER_TABLES = [
  'verification_flags',
  'lesson_progress',
  'bookmarks',
  'notes',
  'exam_sessions',
  'attempts',
  'srs_cards',
  'daily_log',
  'challenge_progress',
  'badges',
  'saved_displays',
] as const;
export type UserTable = (typeof USER_TABLES)[number];
