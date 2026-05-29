export type EmployeeRole =
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

export type EmployeeStatus = 'ACTIVE' | 'BUSY' | 'FIRED';

export interface EmployeeStats {
    completed: number;
    inProgress: number;
    overdue: number;
    totalTasks: number;
    timelyPercent: number;
    avgDays: number;
}

export interface Employee {
    id: string;
    fullName: string;
    role: EmployeeRole;
    specialization?: string;
    phone?: string;
    email?: string;
    status: EmployeeStatus;
    joinedAt?: string;
    stats: EmployeeStats;
}