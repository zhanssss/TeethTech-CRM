// utils/orderUtils.ts

import type { OrderTaskStatus } from '@/src/types/task.types';

interface KanbanColumn {
    id: OrderTaskStatus;
    title: string;
    color: string;
}

export const PHYSIC_COPY_COLUMNS: KanbanColumn[] = [
    { id: '1', title: 'Нужно сделать', color: 'border-t-slate-500' },
    { id: '2', title: 'Гипсовщик', color: 'border-t-yellow-500' },
    { id: '3', title: 'Сканировщик', color: 'border-t-orange-500' },
    { id: '4', title: 'Оператор', color: 'border-t-green-600' },
    { id: '5', title: 'Керамист', color: 'border-t-blue-700' },
    { id: '6', title: 'На проверке', color: 'border-t-purple-500' },
    { id: '7', title: 'Готово', color: 'border-t-slate-500' },
];