import { beforeEach, describe, expect, it } from 'vitest';
import { useTextEditStore } from './text-edit-store';

const draft = { id: null, x: 1, y: 2, content: '', fontSize: 24, color: '#000' };

describe('text edit store', () => {
  beforeEach(() => useTextEditStore.setState({ edit: null }));

  it('starts with no edit in progress', () => {
    expect(useTextEditStore.getState().edit).toBeNull();
  });

  it('begins and ends an edit', () => {
    useTextEditStore.getState().begin(draft);
    expect(useTextEditStore.getState().edit).toMatchObject(draft);
    useTextEditStore.getState().end();
    expect(useTextEditStore.getState().edit).toBeNull();
  });

  it('gives every edit a new session, so the editor remounts', () => {
    useTextEditStore.getState().begin(draft);
    const first = useTextEditStore.getState().edit?.session;
    useTextEditStore.getState().begin(draft);
    expect(useTextEditStore.getState().edit?.session).not.toBe(first);
  });
});
