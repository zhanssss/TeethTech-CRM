export type EmployeeRole =
    | 'TECHNICIAN'
    | 'OPERATOR'
    | 'DISPATCHER'
    | 'ADMIN'
    | 'Зуб-Техник / Керамист'
    | 'Оператор / Моделировщик'
    | 'Диспетчер'
    | 'Админ'
    | 'Сканировщик'
    | 'Гипсовщик'
    | 'Протезист';

export type EmployeeRoleFilter = 'ALL' | EmployeeRole;

export const employeeRoleOptions: {
    id: number;
    label: string;
    value: EmployeeRoleFilter;
}[] = [
    { id: 0, label: 'Все', value: 'ALL' },
    { id: 1, label: 'Зуб-Техник / Керамист', value: 'Зуб-Техник / Керамист' },
    { id: 2, label: 'Оператор / Моделировщик', value: 'Оператор / Моделировщик' },
    { id: 3, label: 'Диспетчер', value: 'Диспетчер' },
    { id: 4, label: 'Админ', value: 'Админ' },
    { id: 5, label: 'Сканировщик', value: 'Сканировщик' },
    { id: 6, label: 'Гипсовщик', value: 'Гипсовщик' },
    { id: 7, label: 'Протезист', value: 'Протезист' },
];

export type EmployeeStatus = 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'FIRED';

export interface EmployeeStats {
    completed: number;
    inProgress: number;
    overdue: number;
    totalTasks?: number;
    totalAssigned?: number;
    timelyPercent?: number;
    onTimeRate?: number;
    avgDays?: number;
    averageDays?: number;
}

export interface Employee {
    id: string;
    name: string;
    fullName?: string;
    role: EmployeeRole;
    specialization?: string;
    phone?: string;
    email?: string;
    status: EmployeeStatus;
    joinedAt?: string;
    stats: EmployeeStats;
}

export type TaskStatus =
    | 'TODO'
    | 'MODELING'
    | 'MILLING'
    | 'POST_PROCESSING'
    | 'DONE';

export type EmployeeTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface EmployeeTask {
    id: string;
    patient: string;
    workType: string;
    material: string;
    deadline: string;
    status: TaskStatus;
    priority: EmployeeTaskPriority;
}
