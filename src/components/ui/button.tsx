import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// Apple-style pill buttons: solid fills carry white text (AA in both themes via the *-solid
// tokens), a soft press-down on click, and a disabled state that reads as "not yet", not broken.
export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:bg-surface-3 disabled:text-fg-subtle disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary-solid text-on-solid shadow-sm hover:brightness-110',
        secondary:
          'bg-surface text-fg shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-surface-2',
        tinted: 'bg-primary-soft text-primary hover:brightness-95',
        ghost: 'text-fg hover:bg-surface-3/60',
        danger: 'bg-danger-solid text-on-solid shadow-sm hover:brightness-110',
        success: 'bg-success-solid text-on-solid shadow-sm hover:brightness-110',
        link: 'rounded-sm text-primary underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-8 px-3.5 text-[13px]',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-7 text-[15px] [&_svg]:size-5',
        icon: 'size-10',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
