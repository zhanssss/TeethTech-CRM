export interface WorkflowTransition {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    code: string;
    name: string;
    description?: string;
    sortOrder?: number;
    colorHex?: string;
}

export interface GetAvailableWorkflowTransitionsArgs {
    workType: string;
    currentStatusId: string;
}

export type WorkflowStatus = {
    id: string;
    code: string;
    name: string;
    description: string;
    sortOrder: number;
    colorHex: string;
};

export type WorkflowStep = {
    id: string;
    workTypeId: string;
    workTypeName: string;
    fromStatusId: string;
    fromStatusName: string;
    toStatusId: string;
    toStatusName: string;
    requiredRole: string;
    sortOrder: number;
};

export type GetWorkflowStepsArgs = {
    workTypeId: string;
};

export type CreateWorkflowStepRequest = {
    workTypeId: string;
    fromStatusId: string;
    toStatusId: string;
    requiredRole: string;
    sortOrder: number;
};

export type OrderStatus = WorkflowStatus;

export type UpsertOrderStatusRequest = {
    id?: string;
    code: string;
    name: string;
    description: string;
    sortOrder: number;
    colorHex: string;
};

export type UpdateOrderStatusArgs = {
    id: string;
    body: UpsertOrderStatusRequest;
};
