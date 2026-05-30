//types/task.types.ts
export type OrderTaskStatus =
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7';

export type TaskStatus =
    | 'TODO'
    | 'MODELING'
    | 'MILLING'
    | 'POST_PROCESSING'
    | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface KanbanColumn<Status extends string = TaskStatus> {
    id: Status;
    title: string;
    color: string;
}

export type WorkBoardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface OrderBoardTask {
    id: string;
    type: string;
    techId: string;
    status: OrderTaskStatus;
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
    images?: TaskImage[];
    description?: string;
}

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

export type TaskComment = {
    id: string;
    author: string;
    text: string;
    createdAt: string;
};

export type TaskAttachment = {
    id: string;
    name: string;
    url: string;
    size: string;
    type: string;
};

export type TaskImage = {
    id: string;
    name: string;
    url: string;
    size: string;
};
