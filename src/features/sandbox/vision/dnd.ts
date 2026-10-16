/** Drag payloads from the Assets and Search panes onto the display canvas. */
import { z } from 'zod';

export const DRAG_MIME = 'application/x-pi-academy-vision';

const payloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('attribute'), item: z.string().min(1) }),
  z.object({ type: z.literal('element'), path: z.string().min(1) }),
]);

export type DragPayload = z.infer<typeof payloadSchema>;

export function encodePayload(p: DragPayload): string {
  return JSON.stringify(p);
}

export function decodePayload(raw: string): DragPayload | null {
  try {
    const r = payloadSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
