import { z } from 'zod';
import { LevelSchema, RoleSchema } from '@/core/schemas';

export const SettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  fontScale: z.number().min(0.85).max(1.4).default(1),
  level: LevelSchema.default('beginner'),
  role: RoleSchema.nullable().default(null),
  /** optional online features (content update check). OFF by default. */
  onlineFeatures: z.boolean().default(false),
  dailyGoal: z.number().int().min(1).max(50).default(10),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function applyTheme(settings: Settings, prefersDark: boolean): void {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
  document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--font-scale', String(settings.fontScale));
}
