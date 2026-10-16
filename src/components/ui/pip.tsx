import { cn } from '@/lib/cn';

/**
 * Pip, the PI Academy mascot: a friendly pressure gauge whose needle is its hair tuft.
 * An original character (no vendor logos); every colour comes from the --pip-* tokens.
 */
export type PipMood = 'happy' | 'wave' | 'cheer' | 'think' | 'sad';

const TICKS = [-60, -30, 0, 30, 60];

export function Pip({
  mood = 'happy',
  size = 96,
  label,
  animate = false,
  className,
}: {
  mood?: PipMood;
  size?: number;
  /** Accessible name. Without one, Pip is decorative and hidden from screen readers. */
  label?: string;
  animate?: boolean;
  className?: string;
}) {
  const eyeDy = mood === 'think' ? -2 : 0;
  const eyeDx = mood === 'think' ? 1.5 : 0;
  const leftArm = mood === 'cheer' ? 'M27 70 Q16 58 14 44' : 'M26 76 Q17 82 15 90';
  const rightArm =
    mood === 'cheer' || mood === 'wave' ? 'M93 70 Q104 58 106 44' : 'M94 76 Q103 82 105 90';
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 overflow-visible', animate && 'animate-pip', className)}
    >
      {/* needle tuft */}
      <line
        x1="60"
        y1="30"
        x2="74"
        y2="9"
        stroke="var(--pip-needle)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="30" r="6" fill="var(--pip-needle)" />
      {/* arms */}
      <path
        d={leftArm}
        stroke="var(--pip-body-shade)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={rightArm}
        stroke="var(--pip-body-shade)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* feet */}
      <ellipse cx="47" cy="106" rx="9" ry="5" fill="var(--pip-body-shade)" />
      <ellipse cx="73" cy="106" rx="9" ry="5" fill="var(--pip-body-shade)" />
      {/* body */}
      <circle cx="60" cy="68" r="38" fill="var(--pip-body)" />
      <path
        d="M24 78 A38 38 0 0 0 96 78 A40 30 0 0 1 24 78Z"
        fill="var(--pip-body-shade)"
        opacity="0.45"
      />
      {/* dial face */}
      <circle cx="60" cy="66" r="28" fill="var(--pip-face)" />
      {TICKS.map((a) => {
        const r = (a - 90) * (Math.PI / 180);
        return (
          <line
            key={a}
            x1={60 + Math.cos(r) * 22}
            y1={66 + Math.sin(r) * 22}
            x2={60 + Math.cos(r) * 26}
            y2={66 + Math.sin(r) * 26}
            stroke="var(--pip-body)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        );
      })}
      {/* eyes */}
      {mood === 'cheer' ? (
        <g stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M45 63 Q50 57 55 63" />
          <path d="M65 63 Q70 57 75 63" />
        </g>
      ) : (
        <g>
          <ellipse cx={50 + eyeDx} cy={62 + eyeDy} rx="4" ry="5" fill="var(--pip-ink)" />
          <ellipse cx={70 + eyeDx} cy={62 + eyeDy} rx="4" ry="5" fill="var(--pip-ink)" />
          <circle cx={51.5 + eyeDx} cy={60 + eyeDy} r="1.4" fill="var(--pip-face)" />
          <circle cx={71.5 + eyeDx} cy={60 + eyeDy} r="1.4" fill="var(--pip-face)" />
        </g>
      )}
      {mood === 'sad' ? (
        <g stroke="var(--pip-ink)" strokeWidth="2" strokeLinecap="round">
          <line x1="44" y1="55" x2="53" y2="51" />
          <line x1="76" y1="55" x2="67" y2="51" />
        </g>
      ) : null}
      {/* cheeks */}
      <ellipse cx="42" cy="73" rx="4.5" ry="3" fill="var(--pip-cheek)" opacity="0.7" />
      <ellipse cx="78" cy="73" rx="4.5" ry="3" fill="var(--pip-cheek)" opacity="0.7" />
      {/* mouth */}
      {mood === 'cheer' ? (
        <path d="M51 72 Q60 86 69 72 Z" fill="var(--pip-ink)" />
      ) : mood === 'sad' ? (
        <path
          d="M53 79 Q60 73 67 79"
          stroke="var(--pip-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : mood === 'think' ? (
        <path
          d="M55 77 Q60 75 66 76"
          stroke="var(--pip-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M52 73 Q60 81 68 73"
          stroke="var(--pip-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* extras */}
      {mood === 'cheer' ? (
        <g fill="var(--xp)">
          <path d="M14 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5Z" />
          <path d="M100 18 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2Z" />
        </g>
      ) : null}
      {mood === 'think' ? (
        <g fill="var(--pip-body)" opacity="0.6">
          <circle cx="94" cy="30" r="3" />
          <circle cx="102" cy="20" r="4.5" />
        </g>
      ) : null}
    </svg>
  );
}
