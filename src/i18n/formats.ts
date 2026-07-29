import {intlLocaleByLocale, type Locale} from './config';

type DateInput = Date | string | number;

function asDate(value: DateInput): Date | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function withDateDefaults(
    options: Intl.DateTimeFormatOptions,
    defaults: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
    if (options.dateStyle !== undefined || options.timeStyle !== undefined) {
        return options;
    }

    return {
        ...defaults,
        ...options,
    };
}

export function formatDate(
    value: DateInput,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const date = asDate(value);
    if (!date) return typeof value === 'string' ? value : '';

    return new Intl.DateTimeFormat(
        intlLocaleByLocale[locale],
        withDateDefaults(options, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    ).format(date);
}

export function formatDateTime(
    value: DateInput,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    return formatDate(
        value,
        locale,
        withDateDefaults(options, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    );
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
