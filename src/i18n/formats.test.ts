import {describe, expect, it} from 'vitest';

import {formatCurrency, formatDate, formatNumber} from './formats';

describe('localized formatters', () => {
    it('formats dates for every supported locale', () => {
        const date = new Date(2026, 0, 5, 12);

        expect(formatDate(date, 'ru')).toBe('05.01.2026');
        expect(formatDate(date, 'kk')).toBe('05.01.2026');
        expect(formatDate(date, 'en')).toBe('01/05/2026');
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
