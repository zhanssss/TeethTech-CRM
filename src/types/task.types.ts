import type { TaskPriority, TaskStatus } from './employee.types';

export interface KanbanColumn {
    id: TaskStatus;
    title: string;
    color: string;
}

export type WorkBoardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkBoardTask {
    id: string;
    patient: string;
    type: string;
    material: string;
    units: number;
    priority: WorkBoardPriority;
    deadline: string;
    status: TaskStatus;
    techId: string;
}

export interface ProductionTask {
    id: string;
    orderId: string;
    patient: string;
    title: string;
    technicianId: string;
    status: TaskStatus;
    deadline: string;
    priority: TaskPriority;
}

export interface OrderBoardTask {
    id: string;
    type: string;
    techId: string;
    status: TaskStatus;
}
