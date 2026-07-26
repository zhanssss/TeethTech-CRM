import {intlLocaleByLocale, type Locale} from './config';

type DateInput = Date | string | number;

function asDate(value: DateInput): Date | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
    value: DateInput,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const date = asDate(value);
    if (!date) return typeof value === 'string' ? value : '';

    return new Intl.DateTimeFormat(intlLocaleByLocale[locale], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    }).format(date);
}

export function formatDateTime(
    value: DateInput,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    return formatDate(value, locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    });
}

export function formatNumber(
    value: number,
    locale: Locale,
    options: Intl.NumberFormatOptions = {}
): string {
    return new Intl.NumberFormat(intlLocaleByLocale[locale], options).format(value);
}

export function formatCurrency(
    value: number,
    locale: Locale,
    options: Intl.NumberFormatOptions = {}
): string {
    return new Intl.NumberFormat(intlLocaleByLocale[locale], {
        style: 'currency',
        currency: 'KZT',
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0,
        ...options,
    }).format(value);
}

export function formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale: Locale,
    options: Intl.RelativeTimeFormatOptions = {}
): string {
    return new Intl.RelativeTimeFormat(intlLocaleByLocale[locale], {
        numeric: 'auto',
        ...options,
    }).format(value, unit);
}
