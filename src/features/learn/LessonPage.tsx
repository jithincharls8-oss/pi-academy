import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Lightbulb,
  Target,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/misc';
import { Markdown } from '@/components/content/Markdown';
import { SourceList } from '@/components/content/SourceList';
import { VerifyNote } from '@/components/content/VerifyNote';
import { QuestionCard } from '@/components/questions/QuestionCard';
import {
  DOMAIN_LABELS,
  LESSON_SECTION_TITLES,
  ROLE_LABELS,
  type LessonSectionKey,
} from '@/core/schemas';
import { recordAnswer } from '@/features/exam/recordAnswer';

const ORDER: LessonSectionKey[] = ['plainEnglish', 'deepDive', 'workedExample', 'diagram'];

export function LessonPage() {
  const { id = '' } = useParams();
  // Keyed by id so drafts (such as an unsaved note) never carry over to another lesson.
  return <LessonView key={id} id={id} />;
}

function LessonView({ id }: { id: string }) {
  const app = useApp();
  const { library, user, rev } = app;
  const lesson = library.lesson.find((l) => l.id === id);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (lesson) user.markLessonViewed(lesson.id);
  }, [lesson, user]);

  const status = useMemo(() => {
    void rev;
    return user.lessonProgress().find((p) => p.lesson_id === id)?.status ?? null;
  }, [user, id, rev]);
  const bookmarked = useMemo(() => {
    void rev;
    return user.isBookmarked('lesson', id);
  }, [user, id, rev]);
  const notes = useMemo(() => {
    void rev;
    return user.notes(id);
  }, [user, id, rev]);

  if (!lesson) {
    return (
      <EmptyState
        title="Lesson not found."
        action={
          <Link to="/learn" className="text-primary underline">
            Back to Learn
          </Link>
        }
      />
    );
  }
  const terms = lesson.keyTerms
    .map((t) => library.glossary.find((g) => g.id === t))
    .filter((g) => g !== undefined);
  const checks = lesson.knowledgeCheck
    .map((q) => library.question.find((x) => x.id === q))
    .filter((q) => q !== undefined);
  const related = lesson.related
    .map((r) => library.lesson.find((l) => l.id === r))
    .filter((l) => l !== undefined);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="min-w-0">
        <nav className="mb-2 text-sm text-fg-muted" aria-label="Breadcrumb">
          <Link to="/learn" className="hover:underline">
            Learn
          </Link>{' '}
          / {DOMAIN_LABELS[lesson.domain]}
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-2 text-lg text-fg-muted">{lesson.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Badge className="capitalize">{lesson.level}</Badge>
          {lesson.roles.map((r) => (
            <Badge key={r} tone="accent">
              {ROLE_LABELS[r]}
            </Badge>
          ))}
          <span className="flex items-center gap-1 text-fg-muted">
            <Clock className="size-4" aria-hidden /> {lesson.minutes} min
          </span>
        </div>
        {lesson.verify ? (
          <VerifyNote
            note={lesson.verifyNote}
            label="Parts of this lesson are unverified"
            className="mt-3"
          />
        ) : null}

        <section
          className="mt-6 rounded-xl bg-surface p-5 shadow-card ring-1 ring-border/70 dark:ring-border"
          aria-labelledby="objectives"
        >
          <h2 id="objectives" className="flex items-center gap-2 font-semibold">
            <Target className="size-5 text-primary" aria-hidden /> Learning objectives
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>

        {ORDER.map((k) => (
          <section key={k} className="mt-8" aria-labelledby={`sec-${k}`}>
            <h2 id={`sec-${k}`} className="text-xl font-semibold">
              {LESSON_SECTION_TITLES[k]}
            </h2>
            <Markdown source={lesson.sections[k]} />
          </section>
        ))}

        <section className="mt-8 rounded-xl bg-danger-soft p-5" aria-labelledby="sec-mistakes">
          <h2
            id="sec-mistakes"
            className="flex items-center gap-2 text-lg font-semibold text-danger"
          >
            <AlertTriangle className="size-5" aria-hidden /> Common mistakes
          </h2>
          <Markdown source={lesson.sections.commonMistakes} />
        </section>

        <section className="mt-6 rounded-xl bg-accent-soft p-5" aria-labelledby="sec-scenario">
          <h2
            id="sec-scenario"
            className="flex items-center gap-2 text-lg font-semibold text-accent"
          >
            <Lightbulb className="size-5" aria-hidden /> Real-world scenario
          </h2>
          <Markdown source={lesson.sections.realWorldScenario} />
        </section>

        <section className="mt-8" aria-labelledby="sec-terms">
          <h2 id="sec-terms" className="text-xl font-semibold">
            Key terms
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {terms.map((t) => (
              <div
                key={t.id}
                className="relative rounded-xl bg-surface p-4 shadow-card ring-1 ring-border/70 transition-[box-shadow,transform] duration-200 focus-within:shadow-raised hover:-translate-y-0.5 hover:shadow-raised dark:ring-border"
              >
                <dt className="font-semibold">
                  {/* The whole card is the link's hit area (stretched ::after). */}
                  <Link
                    to={`/reference/glossary/${t.id}`}
                    className="after:absolute after:inset-0 after:rounded-xl hover:text-primary"
                  >
                    {t.term}
                  </Link>
                </dt>
                <dd className="mt-1 text-sm text-fg-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8" aria-labelledby="sec-check">
          <h2 id="sec-check" className="text-xl font-semibold">
            Knowledge check
          </h2>
          <div className="mt-3 space-y-4">
            {checks.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                label={`${i + 1} of ${checks.length}`}
                onAnswered={(r, a) => recordAnswer(app, q, r, a, 'lesson', null)}
              />
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button
            variant={status === 'completed' ? 'secondary' : 'success'}
            onClick={() => user.setLessonCompleted(lesson.id, status !== 'completed')}
          >
            <CheckCircle2 /> {status === 'completed' ? 'Completed (undo)' : 'Mark lesson complete'}
          </Button>
        </div>

        <section className="mt-8" aria-labelledby="sec-sources">
          <h2 id="sec-sources" className="sr-only">
            Sources
          </h2>
          <SourceList ids={lesson.sources} />
        </section>
      </article>

      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start" aria-label="Lesson tools">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => user.toggleBookmark('lesson', lesson.id)}
          aria-pressed={bookmarked}
        >
          {bookmarked ? <BookmarkCheck /> : <Bookmark />} {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>My notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              aria-label="New note"
              placeholder="Write a note for this lesson…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!note.trim()}
              onClick={() => {
                user.saveNote(lesson.id, note.trim());
                setNote('');
              }}
            >
              Save note
            </Button>
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="group rounded-md bg-surface-2 p-2 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
                    {new Date(n.updated_at).toLocaleDateString()}
                    <button
                      onClick={() => user.deleteNote(n.id)}
                      aria-label="Delete note"
                      className="hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        {related.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Related lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/learn/${r.id}`} className="text-primary hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
