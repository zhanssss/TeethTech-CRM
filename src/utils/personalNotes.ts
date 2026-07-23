import type { PersonalNotePayload } from '@/src/types/personalNote.types';

export const PERSONAL_NOTE_TITLE_LIMIT = 120;
export const PERSONAL_NOTE_CONTENT_LIMIT = 5000;
export const PERSONAL_NOTE_AUTOSAVE_DELAY_MS = 1000;

export function hasPersonalNoteText(note: PersonalNotePayload) {
    return Boolean(note.title.trim() || note.content.trim());
}

export function isSamePersonalNote(
    first: PersonalNotePayload | null,
    second: PersonalNotePayload
) {
    return Boolean(
        first &&
        first.title === second.title &&
        first.content === second.content
    );
}

export function getPersonalNoteError(error: unknown) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error
    ) {
        const status = (error as { status?: unknown }).status;

        if (status === 404) {
            return 'Заметка уже истекла и больше недоступна.';
        }
        if (status === 401) {
            return 'Сессия истекла. Войдите в систему повторно.';
        }
        if (status === 400 || status === 422) {
            return 'Проверьте длину заголовка и текста.';
        }
        if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
            return 'Нет соединения с сервером. Изменения пока не сохранены.';
        }
    }

    return 'Не удалось сохранить заметку. Изменения пока не сохранены.';
}
