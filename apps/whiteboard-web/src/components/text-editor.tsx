'use client';

import type { BoardStore } from '@/canvas/board-store';
import { worldToScreen } from '@/canvas/camera';
import { FONT_FAMILY, LINE_HEIGHT_FACTOR, measureWriting } from '@/canvas/text';
import { useCameraStore } from '@/stores/camera-store';
import { useSelectionStore } from '@/stores/selection-store';
import { useTextEditStore, type TextEdit } from '@/stores/text-edit-store';
import { useToolStore } from '@/stores/tool-store';
import { useEffect, useRef, useState } from 'react';

/** Extra width in screen pixels so the caret at the end of the longest line is not clipped. */
const CARET_ROOM_PX = 4;

/**
 * Overlay for typing a text. Canvas has no text input, so a real `<textarea>` is laid over the board
 * exactly where the text will be drawn (it gives us the caret, selection, IME and clipboard for free).
 * The component renders nothing unless `useTextEditStore` holds an edit in progress.
 */
export function TextEditor({ store }: { store: BoardStore }) {
  const edit = useTextEditStore((state) => state.edit);
  if (!edit) return null;
  // `key` = session: every new edit gets a fresh `<TextEditorField>` with fresh local state.
  return <TextEditorField key={edit.session} edit={edit} store={store} />;
}

/**
 * The textarea of one edit. It tracks the camera, so panning/zooming while typing keeps it glued to
 * the text: the position is `worldToScreen(x, y)` and the font size is multiplied by the zoom.
 * It is sized from `measureWriting` (the same function that sizes the shape in the model) instead of
 * the browser's own layout, so what you see while typing is what the canvas draws afterwards.
 * Leaving the field (blur), Escape and Ctrl/Cmd+Enter commit; plain Enter inserts a new line.
 */
function TextEditorField({ edit, store }: { edit: TextEdit; store: BoardStore }) {
  const camera = useCameraStore((state) => state.camera);
  const [content, setContent] = useState(edit.content);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  // Escape/Ctrl+Enter commit and the unmounting field may blur right after: commit only once.
  const committed = useRef(false);

  // Focus with the caret at the end, so typing continues the existing text.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, []);

  /**
   * Writes the result to the board store as ONE change (one future undo step), then closes the editor.
   * Trailing whitespace is trimmed. An empty text is not kept: a new one is simply dropped and an
   * existing one is removed. New texts get a fresh id; the tool switches to "select" with the text
   * selected, so the next click does not stack another text on top.
   */
  const commit = () => {
    if (committed.current) return;
    committed.current = true;

    const text = content.trimEnd();
    useTextEditStore.getState().end();

    if (edit.id === null) {
      if (text === '') return;
      const id = crypto.randomUUID();
      store.add({
        id,
        type: 'writing',
        x: edit.x,
        y: edit.y,
        color: edit.color,
        fontSize: edit.fontSize,
        content: text,
        ...measureWriting(text, edit.fontSize),
      });
      useSelectionStore.getState().select(id);
    } else if (text === '') {
      store.remove(edit.id);
      useSelectionStore.getState().select(null);
    } else if (text !== edit.content) {
      // `w`/`h` are derived from the content, so they change in the same patch.
      store.update(edit.id, { content: text, ...measureWriting(text, edit.fontSize) });
    }
    useToolStore.getState().setTool('select');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter/Escape pressed while composing (IME) belong to the composition, not to us.
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      commit();
    }
  };

  // An empty text still needs a box to click into, hence the one-space measurement.
  const { w, h } = measureWriting(content === '' ? ' ' : content, edit.fontSize);
  const origin = worldToScreen(camera, edit);

  return (
    <textarea
      ref={fieldRef}
      value={content}
      onChange={(event) => setContent(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      aria-label="Edit text"
      spellCheck={false}
      wrap="off"
      rows={1}
      style={{
        position: 'absolute',
        left: origin.x,
        top: origin.y,
        width: w * camera.zoom + CARET_ROOM_PX,
        height: h * camera.zoom,
        margin: 0,
        padding: 0,
        border: 'none',
        outline: '1px dashed #2563eb',
        outlineOffset: 4,
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        color: edit.color,
        fontFamily: FONT_FAMILY,
        fontSize: edit.fontSize * camera.zoom,
        lineHeight: LINE_HEIGHT_FACTOR,
      }}
    />
  );
}
