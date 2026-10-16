import { useRef, useState } from 'react';
import { Download, HardDrive, RotateCcw, Upload, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/input';
import { PageHeader, Switch } from '@/components/ui/misc';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { LEVELS, ROLES, ROLE_LABELS, type Level, type Role } from '@/core/schemas';
import { createBackup, resetUserData, restoreBackup } from '@/db/backup';
import { readFileText, saveTextFile } from '@/lib/files';
import { localDate } from '@/lib/id';
import { useOnline } from '@/lib/useOnline';

const STORAGE_LABEL = {
  tauri: 'App data folder on this computer',
  indexeddb: 'Browser storage (IndexedDB)',
  memory: 'Memory only (not saved)',
};

export function SettingsPage() {
  const { settings, updateSettings, db, persistence, flush, reloadLibrary, library } = useApp();
  const online = useOnline();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const exportBackup = async (): Promise<void> => {
    try {
      const ok = await saveTextFile(
        `pi-academy-backup-${localDate()}.json`,
        JSON.stringify(createBackup(db), null, 2),
      );
      if (ok) setMessage({ tone: 'ok', text: 'Backup saved.' });
    } catch (e) {
      setMessage({
        tone: 'error',
        text: `Could not save the backup: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  };

  const importBackup = async (file: File): Promise<void> => {
    try {
      const res = restoreBackup(db, JSON.parse(await readFileText(file)) as unknown);
      if (res.ok) {
        await flush();
        reloadLibrary();
        setMessage({ tone: 'ok', text: `Restored ${res.rows} records from ${file.name}.` });
      } else setMessage({ tone: 'error', text: res.error });
    } catch (e) {
      setMessage({ tone: 'error', text: `Could not read that file: ${(e as Error).message}` });
    }
  };

  const reset = async (includeContent: boolean): Promise<void> => {
    resetUserData(db, includeContent);
    await flush();
    reloadLibrary();
    setMessage({
      tone: 'ok',
      text: includeContent
        ? 'All progress and your own content were deleted.'
        : 'All progress was deleted.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Appearance, learning preferences, and your data. Everything is stored on this device."
      />
      {message ? (
        <div
          role="status"
          className={
            message.tone === 'ok'
              ? 'rounded-md bg-success-soft p-3 text-success'
              : 'rounded-md bg-danger-soft p-3 text-danger'
          }
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="theme">Theme</Label>
              <Select
                id="theme"
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })}
              >
                <option value="system">Match my system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="font">Text size: {Math.round(settings.fontScale * 100)}%</Label>
              <input
                id="font"
                type="range"
                min={0.85}
                max={1.4}
                step={0.05}
                value={settings.fontScale}
                onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
                className="accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>
              Used to suggest your next lesson and to filter course paths.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="level">Level</Label>
              <Select
                id="level"
                value={settings.level}
                onChange={(e) => updateSettings({ level: e.target.value as Level })}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l[0]!.toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role path</Label>
              <Select
                id="role"
                value={settings.role ?? ''}
                onChange={(e) =>
                  updateSettings({ role: e.target.value ? (e.target.value as Role) : null })
                }
              >
                <option value="">No role selected</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline status</CardTitle>
            <CardDescription>
              PI Academy works fully offline. Online features are off unless you turn them on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {online ? (
                <Wifi className="size-4 text-success" aria-hidden />
              ) : (
                <WifiOff className="size-4 text-fg-muted" aria-hidden />
              )}
              {online
                ? 'This device is online.'
                : 'This device is offline. Everything still works.'}
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-fg-muted" aria-hidden />
              Progress is saved to: {STORAGE_LABEL[persistence.kind]}
            </div>
            <div className="text-fg-muted">Content version {library.version}</div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
              <div>
                <Label htmlFor="online">Allow online features</Label>
                <p className="text-fg-muted">
                  Only used to open source links in your browser. No data is ever uploaded, and
                  there is no account or leaderboard.
                </p>
              </div>
              <Switch
                id="online"
                checked={settings.onlineFeatures}
                onCheckedChange={(v) => updateSettings({ onlineFeatures: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup and restore</CardTitle>
            <CardDescription>
              Export your progress, notes, bookmarks, exam history and your own content to a file,
              or restore from one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => void exportBackup()}>
              <Download /> Export backup
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload /> Restore from file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Backup file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
                e.target.value = '';
              }}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="danger">
                  <RotateCcw /> Reset
                </Button>
              </DialogTrigger>
              <DialogContent
                title="Reset PI Academy?"
                description="This cannot be undone. Export a backup first if you might want your data back."
              >
                <div className="flex flex-col gap-2">
                  <DialogClose asChild>
                    <Button variant="danger" onClick={() => void reset(false)}>
                      Delete my progress
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="secondary" onClick={() => void reset(true)}>
                      Delete progress and content I added
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
