'use client';

import { Toolbar, ToolbarToggleGroup, ToolbarToggleItem } from '@whiteboard/ui';
import {
  Circle,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Square,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { isToolType, useToolStore, type ToolType } from '@/stores/tool-store';

const TOOL_CONFIG: Record<
  ToolType,
  { label: string; shortcut: string; icon: LucideIcon; disabled?: boolean }
> = {
  select: { label: 'Select', shortcut: 'v', icon: MousePointer2 },
  rectangle: { label: 'Rectangle', shortcut: 'r', icon: Square },
  ellipse: { label: 'Ellipse', shortcut: 'o', icon: Circle },
  arrow: { label: 'Arrow', shortcut: 'a', icon: MoveUpRight },
  text: { label: 'Text', shortcut: 't', icon: Type },
  // TODO: enable once freehand strokes exist in the board model.
  pen: { label: 'Pen', shortcut: 'p', icon: Pencil, disabled: true },
};

const TOOL_ENTRIES = Object.entries(TOOL_CONFIG) as [ToolType, (typeof TOOL_CONFIG)[ToolType]][];

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && target.closest('input, textarea, [contenteditable]') !== null
  );
}

export function BoardToolbar() {
  const activeTool = useToolStore((s) => s.activeTool);
  const setTool = useToolStore((s) => s.setTool);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const entry = TOOL_ENTRIES.find(([, c]) => c.shortcut === e.key.toLowerCase());
      if (entry && !entry[1].disabled) setTool(entry[0]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setTool]);

  return (
    <Toolbar aria-label="Board tools" className="pointer-events-auto">
      <ToolbarToggleGroup
        type="single"
        value={activeTool}
        // Radix emits '' when the active item is clicked again; keep the current tool then.
        onValueChange={(value) => isToolType(value) && setTool(value)}
        aria-label="Tool"
        className="flex gap-1"
      >
        {TOOL_ENTRIES.map(([tool, { label, shortcut, icon: Icon, disabled }]) => (
          <ToolbarToggleItem
            key={tool}
            value={tool}
            disabled={disabled}
            aria-label={label}
            aria-keyshortcuts={shortcut.toUpperCase()}
            title={`${label} (${shortcut.toUpperCase()})`}
          >
            <Icon size={18} aria-hidden />
          </ToolbarToggleItem>
        ))}
      </ToolbarToggleGroup>
    </Toolbar>
  );
}
