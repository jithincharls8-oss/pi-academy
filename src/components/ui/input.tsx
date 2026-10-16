import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const field =
  'w-full rounded-[10px] border border-border-strong/70 bg-surface px-3 text-sm text-fg transition-shadow placeholder:text-fg-subtle focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:bg-surface-2 disabled:text-fg-subtle';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(field, 'h-10', className)} {...p} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-24 py-2', className)} {...p} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => (
    <select
      ref={ref}
      className={cn(
        field,
        'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9 select-chevron',
        className,
      )}
      {...p}
    />
  ),
);
Select.displayName = 'Select';

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-fg', className)} {...p} />;
}
