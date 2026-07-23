import { describe, expect, it } from 'vitest';

import {
    getPersonalNoteError,
    hasPersonalNoteText,
    isSamePersonalNote,
} from '@/src/utils/personalNotes';

describe('personal notes autosave helpers', () => {
    it('does not create an empty note when the editor is simply opened', () => {
        expect(hasPersonalNoteText({ title: '', content: '' })).toBe(false);
        expect(hasPersonalNoteText({ title: '   ', content: '\n' })).toBe(false);
    });

    it('considers either title or content enough to create a note', () => {
        expect(hasPersonalNoteText({ title: 'Позвонить', content: '' })).toBe(true);
        expect(hasPersonalNoteText({ title: '', content: 'Уточнить цвет' })).toBe(true);
    });

    it('does not save when title and content are unchanged', () => {
        const persisted = { title: 'Позвонить', content: 'Уточнить цвет' };

        expect(isSamePersonalNote(persisted, { ...persisted })).toBe(true);
        expect(
            isSamePersonalNote(persisted, {
                ...persisted,
                content: 'Уточнить цвет до пятницы',
            })
        ).toBe(false);
    });

    it('explains a 404 as an expired note', () => {
        expect(getPersonalNoteError({ status: 404 })).toContain('истекла');
    });
});
