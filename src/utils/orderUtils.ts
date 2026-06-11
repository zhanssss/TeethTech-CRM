// utils/orderUtils.ts

import type {
    OrderKanbanColumn,
    OrderTaskType,
} from '@/src/types/order.types';
import type { OrderTaskStatus } from '@/src/types/task.types';

interface KanbanColumn {
    id: OrderTaskStatus;
    title: string;
    color: string;
}

export const ORDER_TASK_TYPE_OPTIONS: {
    value: OrderTaskType;
    label: string;
}[] = [
    { value: 'PHYSICAL_COPY', label: 'Физическая копия' },
    { value: 'DIGITAL_COPY', label: 'Электронная копия' },
    { value: 'PROSTHESIS', label: 'Протез' },
];

export const ORDER_TASK_TYPE_LABELS: Record<OrderTaskType, string> = {
    PHYSICAL_COPY: 'Физическая копия',
    DIGITAL_COPY: 'Электронная копия',
    ELECTRONIC_COPY: 'Электронная копия',
    PROSTHESIS: 'Протез',
};

export const ALL_ORDER_TASK_COLUMNS: KanbanColumn[] = [
    { id: '1', title: 'Нужно сделать', color: 'border-t-slate-500' },
    { id: '2', title: 'Гипсовщик', color: 'border-t-yellow-500' },
    { id: '3', title: 'Сканировщик', color: 'border-t-orange-500' },
    { id: '4', title: 'Оператор', color: 'border-t-green-600' },
    { id: '5', title: 'Керамист', color: 'border-t-blue-700' },
    { id: '8', title: 'Протезист', color: 'border-t-cyan-500' },
    { id: '6', title: 'На проверке', color: 'border-t-purple-500' },
    { id: '7', title: 'Готово', color: 'border-t-slate-500' },
];

export const PHYSIC_COPY_COLUMNS = ALL_ORDER_TASK_COLUMNS;

export const TASK_TYPE_WORKFLOWS: Record<OrderTaskType, OrderTaskStatus[]> = {
    PHYSICAL_COPY: ['1', '2', '3', '4', '5', '6', '7'],
    DIGITAL_COPY: ['1', '4', '5', '6', '7'],
    ELECTRONIC_COPY: ['1', '4', '5', '6', '7'],
    PROSTHESIS: ['1', '2', '8', '6', '7'],
};

const STAGE_MATCHERS: {
    id: OrderTaskStatus;
    tokens: string[];
}[] = [
    { id: '1', tokens: ['1', 'todo', 'new', 'not started', 'не начато', 'нужно сделать'] },
    { id: '2', tokens: ['2', 'plaster', 'gypsum', 'гипс'] },
    { id: '3', tokens: ['3', 'scan', 'скан'] },
    { id: '4', tokens: ['4', 'operator', 'cad', 'cam', 'оператор'] },
    { id: '5', tokens: ['5', 'ceramist', 'керамист'] },
    { id: '6', tokens: ['6', 'approval', 'review', 'waiting', 'провер'] },
    { id: '7', tokens: ['7', 'done', 'closed', 'готов'] },
    { id: '8', tokens: ['8', 'prosthetist', 'prosthesis', 'протез'] },
];

function normalizeValue(value: string | null | undefined) {
    return (value ?? '').toLowerCase().replace(/[-_/]+/g, ' ').trim();
}

export function normalizeOrderTaskType(value: string | null | undefined): OrderTaskType {
    const normalizedValue = normalizeValue(value);

    if (normalizedValue.includes('prosthesis') || normalizedValue.includes('протез')) {
        return 'PROSTHESIS';
    }

    if (
        normalizedValue.includes('digital') ||
        normalizedValue.includes('electronic') ||
        normalizedValue.includes('электрон')
    ) {
        return 'DIGITAL_COPY';
    }

    return 'PHYSICAL_COPY';
}

export function getTaskWorkflow(taskType: string | null | undefined) {
    return TASK_TYPE_WORKFLOWS[normalizeOrderTaskType(taskType)];
}

export function canTaskMoveToColumn(
    task: {
        taskType?: string | null;
    },
    columnId: string
) {
    return getTaskWorkflow(task.taskType).includes(columnId as OrderTaskStatus);
}

export function getOrderTaskColumns(tasks: Array<{ taskType?: string | null }>) {
    const taskTypes = tasks.length
        ? tasks.map((task) => normalizeOrderTaskType(task.taskType))
        : ['PHYSICAL_COPY' as OrderTaskType];
    const allowedStatusIds = new Set(
        taskTypes.flatMap((taskType) => TASK_TYPE_WORKFLOWS[taskType])
    );

    return ALL_ORDER_TASK_COLUMNS.filter((column) => allowedStatusIds.has(column.id));
}

function getKanbanColumnKey(column: OrderKanbanColumn) {
    return normalizeValue(column.title || column.statusName || column.statusId || '');
}

export function mergeDuplicateKanbanColumns(columns: OrderKanbanColumn[]) {
    const columnsByStage = new Map<string, OrderKanbanColumn>();

    columns.forEach((column) => {
        const key = getKanbanColumnKey(column);
        const existingColumn = columnsByStage.get(key);

        if (!existingColumn) {
            columnsByStage.set(key, {
                ...column,
                tasks: [...column.tasks],
            });
            return;
        }

        const existingTaskIds = new Set(existingColumn.tasks.map((task) => task.id));
        const mergedTasks = [
            ...existingColumn.tasks,
            ...column.tasks.filter((task) => !existingTaskIds.has(task.id)),
        ];

        columnsByStage.set(key, {
            ...existingColumn,
            taskCount: mergedTasks.length,
            tasks: mergedTasks,
        });
    });

    return Array.from(columnsByStage.values());
}

export function getColumnStatusId(column: OrderKanbanColumn): OrderTaskStatus | null {
    const haystack = normalizeValue(
        [
            column.statusId,
            column.statusName,
            column.title,
        ].filter(Boolean).join(' ')
    );

    return STAGE_MATCHERS.find((matcher) =>
        matcher.tokens.some((token) => haystack.includes(normalizeValue(token)))
    )?.id ?? null;
}

export function filterKanbanColumnsByTaskTypes(
    columns: OrderKanbanColumn[],
    taskTypes: string[]
) {
    if (!taskTypes.length) return columns;

    const allowedStatusIds = new Set(
        taskTypes.flatMap((taskType) => getTaskWorkflow(taskType))
    );

    return columns.filter((column) => {
        const statusId = getColumnStatusId(column);

        return !statusId || allowedStatusIds.has(statusId) || column.tasks.length > 0;
    });
}
