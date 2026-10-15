import { isTauri } from '@/db/persistence';

/** Save a text file: native save dialog on desktop, a download in the browser. */
export async function saveTextFile(
  filename: string,
  text: string,
  mime = 'application/json',
): Promise<boolean> {
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const ext = filename.split('.').pop() ?? 'json';
    const path = await save({
      defaultPath: filename,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    if (!path) return false;
    await writeTextFile(path, text);
    return true;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Read a user-chosen file as text (max 50 MB). */
export function readFileText(file: File): Promise<string> {
  if (file.size > 50 * 1024 * 1024) return Promise.reject(new Error('File is larger than 50 MB.'));
  return file.text();
}
