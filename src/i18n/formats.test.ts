import {afterEach, describe, expect, it, vi} from 'vitest';

import {formatCurrency, formatDate, formatDateTime, formatNumber} from './formats';

describe('localized formatters', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('formats dates for every supported locale', () => {
        const date = new Date(2026, 0, 5, 12);

        expect(formatDate(date, 'ru')).toBe('05.01.2026');
        expect(formatDate(date, 'kk')).toBe('05.01.2026');
        expect(formatDate(date, 'en')).toBe('01/05/2026');
    });

    it('supports dateStyle and timeStyle without mixing component options', () => {
        const date = new Date(2026, 0, 5, 12, 30);
        const NativeDateTimeFormat = Intl.DateTimeFormat;

        vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
            locales,
            options,
        ) {
            if (options?.dateStyle !== undefined || options?.timeStyle !== undefined) {
                throw new TypeError('Style shortcuts are not supported');
            }

            return new NativeDateTimeFormat(locales, options);
        } as typeof Intl.DateTimeFormat);

        expect(() => formatDate(date, 'ru', {
            dateStyle: 'long',
        })).not.toThrow();
        expect(() => formatDateTime(date, 'ru', {
            dateStyle: 'long',
            timeStyle: 'short',
        })).not.toThrow();
    });

    it('keeps KZT while changing number presentation', () => {
        const ru = formatCurrency(120000, 'ru');
        const en = formatCurrency(120000, 'en');

        expect(ru).toContain('120');
        expect(en).toContain('120');
        expect(ru).toMatch(/₸|KZT/u);
        expect(en).toMatch(/₸|KZT/u);
        expect(formatNumber(1250, 'en')).toBe('1,250');
    });
});
