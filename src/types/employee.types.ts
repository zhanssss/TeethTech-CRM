export type EmployeeRole = 'TECHNICIAN' | 'OPERATOR' | 'DISPATCHER' | 'ADMIN';

export type EmployeeStatus = 'ACTIVE' | 'BUSY' | 'OFFLINE';

export type TaskStatus =
    | 'TODO'
    | 'MODELING'
    | 'MILLING'
    | 'POST_PROCESSING'
    | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface EmployeeStats {
    completed: number;
    inProgress: number;
    overdue: number;
    totalAssigned: number;
    onTimeRate: number;
    averageDays: number;
}

export interface Employee {
    id: string;
    name: string;
    role: EmployeeRole;
    specialization: string;
    status: EmployeeStatus;
    phone?: string;
    email?: string;
    joinedAt?: string;
    stats: EmployeeStats;
}

export interface EmployeeTask {
    id: string;
    patient: string;
    workType: string;
    material: string;
    deadline: string;
    status: TaskStatus;
    priority: TaskPriority;
}