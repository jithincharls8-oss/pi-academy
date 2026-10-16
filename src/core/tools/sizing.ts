/**
 * PI Data Archive sizing from documented OSIsoft course formulas only (research/da.md,
 * da.archive-files). Nothing here is extrapolated beyond those rules.
 */

export const SIZING_SOURCES = [
  'da-admin-workbook-2017r2',
  'da-arch-workbook',
  'da-uc23-da-performance',
];

export interface ArchiveSizing {
  /** RAM in MB divided by 3 */
  byMemoryMb: number;
  /** 3 × licensed points / 1024 */
  byPointsMb: number;
  /** the smaller of the two, rounded down to a power of two, clamped to 256..10,240 MB */
  recommendedMb: number;
  /** which rule decided the result */
  limitedBy: 'memory' | 'points' | 'minimum' | 'maximum';
}

const MIN_MB = 256;
const MAX_MB = 10_240;

function floorPow2(n: number): number {
  if (n < 1) return 0;
  return 2 ** Math.floor(Math.log2(n));
}

/**
 * Archive file size guideline from the PI Server System Administration workbook:
 * (physical memory MB) ÷ 3, or 3 × (licensed points) / 1024 MB, whichever is smaller; round down
 * to a power of 2, minimum 256 MB, maximum 10,240 MB.
 */
export function archiveFileSize(ramMb: number, licensedPoints: number): ArchiveSizing {
  const byMemoryMb = ramMb / 3;
  const byPointsMb = (3 * licensedPoints) / 1024;
  const smaller = Math.min(byMemoryMb, byPointsMb);
  const limitedByRule: ArchiveSizing['limitedBy'] = byMemoryMb <= byPointsMb ? 'memory' : 'points';
  const p2 = floorPow2(smaller);
  if (p2 < MIN_MB) return { byMemoryMb, byPointsMb, recommendedMb: MIN_MB, limitedBy: 'minimum' };
  // 10,240 is not a power of two; the cap applies after rounding.
  if (p2 >= MAX_MB || smaller >= MAX_MB) {
    return { byMemoryMb, byPointsMb, recommendedMb: MAX_MB, limitedBy: 'maximum' };
  }
  return { byMemoryMb, byPointsMb, recommendedMb: p2, limitedBy: limitedByRule };
}

/** The architecture course's default archive size table (licensed points → MB). */
export const ARCHIVE_SIZE_TABLE: { maxPoints: number | null; mb: number }[] = [
  { maxPoints: 87_381, mb: 256 },
  { maxPoints: 174_762, mb: 512 },
  { maxPoints: 349_525, mb: 1_024 },
  { maxPoints: 699_050, mb: 2_048 },
  { maxPoints: 1_398_101, mb: 4_096 },
  { maxPoints: 2_796_202, mb: 8_192 },
  { maxPoints: null, mb: 10_240 },
];

export function tableSize(points: number): number {
  for (const row of ARCHIVE_SIZE_TABLE)
    if (row.maxPoints === null || points <= row.maxPoints) return row.mb;
  return MAX_MB;
}

/** Disk-space starting estimates from the architecture course, per 1,000 points. */
export function diskEstimates(points: number): { label: string; mb: number }[] {
  const k = points / 1000;
  return [
    { label: 'Archives', mb: Math.ceil(10 * k) },
    { label: 'Event queue', mb: Math.ceil(5 * k) },
    { label: 'Databases', mb: Math.ceil(11 * k + 1) },
    { label: 'Message logs', mb: 10 },
  ];
}
