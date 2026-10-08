import { Toolbar as ToolbarPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export function Toolbar({ className, ...props }: ComponentProps<typeof ToolbarPrimitive.Root>) {
  return (
    <ToolbarPrimitive.Root
      className={cn(
        'flex min-h-11 items-center gap-1 rounded-lg border border-neutral-200 bg-white/90 p-1 shadow-sm backdrop-blur',
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarButton({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Button>) {
  return (
    <ToolbarPrimitive.Button
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-neutral-700',
        'hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      className={cn('mx-1 h-6 w-px bg-neutral-200', className)}
      {...props}
    />
  );
}

export function ToolbarToggleGroup(props: ComponentProps<typeof ToolbarPrimitive.ToggleGroup>) {
  return <ToolbarPrimitive.ToggleGroup {...props} />;
}

export function ToolbarToggleItem({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.ToggleItem>) {
  return (
    <ToolbarPrimitive.ToggleItem
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-neutral-700',
        'hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
        'data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}
