import { useState, type ReactNode } from 'react';
import { Check, Flame, Plus, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { EmptyState, PageHeader, Progress, Stat, Switch } from '@/components/ui/misc';
import { Pip, type PipMood } from '@/components/ui/pip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLOURS: { token: string; label: string; use: string }[] = [
  { token: '--primary-solid', label: 'Blue', use: 'Primary actions, current lesson' },
  { token: '--success-solid', label: 'Green', use: 'Correct, completed' },
  { token: '--danger-solid', label: 'Red', use: 'Wrong answer, destructive' },
  { token: '--flame', label: 'Orange', use: 'Streak' },
  { token: '--xp', label: 'Yellow', use: 'XP and levels' },
  { token: '--challenge', label: 'Purple', use: 'Challenges, unit checks' },
  { token: '--surface', label: 'Surface', use: 'Cards' },
  { token: '--bg', label: 'Background', use: 'Page' },
];

const TYPE: { cls: string; label: string }[] = [
  { cls: 'text-[32px] font-bold tracking-[-0.03em]', label: 'Large title · 32 bold' },
  { cls: 'text-[22px] font-bold tracking-[-0.02em]', label: 'Title · 22 bold' },
  { cls: 'text-[17px] font-semibold tracking-[-0.02em]', label: 'Headline · 17 semibold' },
  { cls: 'text-[15px]', label: 'Body · 15 regular' },
  { cls: 'text-[13px] text-fg-muted', label: 'Footnote · 13 secondary' },
  { cls: 'font-mono text-[13px]', label: 'RB.P101.FLOW · 13 mono for tags and values' },
];

const MOODS: PipMood[] = ['happy', 'wave', 'cheer', 'think', 'sad'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
      {children}
    </section>
  );
}

/** Every component in every state, in the current theme. Used for design review and screenshots. */
export function StyleGuidePage() {
  const [on, setOn] = useState(true);
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Design system"
        title="Style guide"
        description="The PI Academy look: Apple system colours and type, a Duolingo-style learning path, and Pip the gauge. Switch the theme in Settings to see both."
      />

      <Section title="Pip, the mascot">
        <Card className="flex flex-wrap items-end gap-8 p-6">
          {MOODS.map((m) => (
            <figure key={m} className="flex flex-col items-center gap-2">
              <Pip mood={m} size={96} />
              <figcaption className="text-[13px] font-medium text-fg-muted capitalize">
                {m}
              </figcaption>
            </figure>
          ))}
        </Card>
        <p className="max-w-2xl text-sm text-fg-muted">
          Pip is a pressure gauge whose needle is its hair. Happy greets, wave says hello on empty
          pages, cheer celebrates a correct answer or streak, think marks hints, sad marks a wrong
          answer. Pip is an original character, not an AVEVA mark.
        </p>
      </Section>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOURS.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-xl ring-1 ring-border">
              <div className="h-16" style={{ background: `var(${c.token})` }} />
              <div className="bg-surface p-3">
                <div className="text-sm font-semibold">{c.label}</div>
                <div className="font-mono text-[11px] text-fg-muted">{c.token}</div>
                <div className="mt-1 text-xs text-fg-muted">{c.use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <Card className="space-y-3 p-6">
          {TYPE.map((t) => (
            <div key={t.label} className={t.cls}>
              {t.label}
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Buttons">
        <Card className="space-y-4 p-6">
          {(['primary', 'secondary', 'tinted', 'ghost', 'success', 'danger', 'link'] as const).map(
            (v) => (
              <div key={v} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-[13px] text-fg-muted capitalize">{v}</span>
                <Button variant={v} size="sm">
                  Small
                </Button>
                <Button variant={v}>Default</Button>
                <Button variant={v} size="lg">
                  <Plus /> Large
                </Button>
                <Button variant={v} disabled>
                  Disabled
                </Button>
              </div>
            ),
          )}
          <div className="flex items-center gap-3">
            <span className="w-24 text-[13px] text-fg-muted">Icon</span>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Badges">
        <Card className="flex flex-wrap gap-2 p-6">
          {(
            [
              'neutral',
              'primary',
              'success',
              'warning',
              'danger',
              'info',
              'accent',
              'outline',
              'xp',
            ] as const
          ).map((t) => (
            <Badge key={t} tone={t}>
              {t === 'xp' ? <Star /> : t === 'success' ? <Check /> : null}
              {t === 'outline' ? 'Unverified' : t}
            </Badge>
          ))}
        </Card>
      </Section>

      <Section title="Form controls">
        <Card className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sg-input">Tag name</Label>
            <Input id="sg-input" placeholder="RB.P101.FLOW" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sg-disabled">Disabled</Label>
            <Input id="sg-disabled" disabled value="PISRV01" readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sg-select">Point type</Label>
            <Select id="sg-select" defaultValue="Float32">
              <option>Float32</option>
              <option>Float64</option>
              <option>Int32</option>
              <option>Digital</option>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={on} onCheckedChange={setOn} aria-label="Compression on" />
            <span className="text-sm">Compression {on ? 'on' : 'off'}</span>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="sg-text">Note</Label>
            <Textarea id="sg-text" placeholder="What did you learn?" />
          </div>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Quiz</TabsTrigger>
            <TabsTrigger value="b">Mock exam</TabsTrigger>
            <TabsTrigger value="c">Review</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="text-sm text-fg-muted">
            Segmented control, Apple style.
          </TabsContent>
          <TabsContent value="b" className="text-sm text-fg-muted">
            Second tab.
          </TabsContent>
          <TabsContent value="c" className="text-sm text-fg-muted">
            Third tab.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Progress and stats">
        <Card className="space-y-4 p-6">
          <Progress value={35} label="Primary progress" />
          <Progress value={70} tone="success" label="Success progress" />
          <Progress value={50} tone="xp" label="XP progress" />
        </Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Streak"
            value="12"
            hint="days"
            icon={<Flame className="size-4 text-flame" aria-hidden />}
          />
          <Stat
            label="XP"
            value="1,240"
            icon={<Star className="size-4 fill-xp text-xp" aria-hidden />}
          />
          <Stat label="Lessons" value="18" hint="of 95" />
          <Stat label="Readiness" value="72%" />
        </div>
      </Section>

      <Section title="Cards and empty states">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Exception and compression</CardTitle>
              <CardDescription>How the PI System decides which values to keep.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm">Start lesson</Button>
            </CardContent>
          </Card>
          <EmptyState title="No bookmarks yet" action={<Button size="sm">Browse lessons</Button>}>
            Bookmark a lesson and it shows up here.
          </EmptyState>
        </div>
      </Section>
    </div>
  );
}
