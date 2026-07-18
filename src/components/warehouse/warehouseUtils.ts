import type { InventoryStatusRule, StockLevelStatus } from '@/src/types/warehouse.types';

const inventoryStatusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    IN_PROGRESS: 'Идёт пересчёт',
    COMPLETED: 'Завершена',
    CANCELLED: 'Отменена',
};

const inventoryStatusClasses: Record<string, string> = {
    DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
    IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

export function getInventoryStatusLabel(statusCode: string, rule?: InventoryStatusRule) {
    return rule?.name || inventoryStatusLabels[statusCode] || statusCode;
}

export function getInventoryStatusClasses(statusCode: string, rule?: InventoryStatusRule) {
    if (rule?.marksCancelled) return inventoryStatusClasses.CANCELLED;
    if (rule?.marksCompleted) return inventoryStatusClasses.COMPLETED;
    if (rule?.allowsCounting || rule?.locksWarehouse) return inventoryStatusClasses.IN_PROGRESS;
    if (rule?.initial) return inventoryStatusClasses.DRAFT;
    return inventoryStatusClasses[statusCode] || inventoryStatusClasses.DRAFT;
}

export const stockStatusLabels: Record<StockLevelStatus, string> = {
    SUFFICIENT: 'Достаточно',
    LOW: 'На грани',
    CRITICAL: 'Критично',
};

export const stockStatusClasses: Record<StockLevelStatus, string> = {
    SUFFICIENT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    LOW: 'border-amber-200 bg-amber-50 text-amber-700',
    CRITICAL: 'border-red-200 bg-red-50 text-red-700',
};

export function formatQuantity(value: number | null | undefined, unit?: string) {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ''}`;
}

export function formatDateTime(value: string | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
    if (!error || typeof error !== 'object') return fallback;

    const apiError = error as {
        status?: number | string;
        data?: string | { message?: string; error?: string; detail?: string };
        error?: string;
    };

    if (typeof apiError.data === 'string' && apiError.data.trim()) return apiError.data;
    if (apiError.data && typeof apiError.data === 'object') {
        return apiError.data.message || apiError.data.detail || apiError.data.error || fallback;
    }
    if (apiError.status === 409) return 'Операция конфликтует с текущим состоянием склада';
    return apiError.error || fallback;
}

export function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
}
