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

type StagesWorkflowWorkTypesDTO = {
    code: string,
    name: string,
    description: string,
    colorHex: string,
    initial: boolean,
    terminal: boolean,
    review: boolean,
    requiredRole: string
}

export type CreateWorkflowWorkTypesDTO = {
    workTypeCode: string,
    workTypeName: string,
    description: string,
    stages: StagesWorkflowWorkTypesDTO[]
}

export type CreateWorkflowWorkTypesResponseDTO = {
    workTypeId: string,
    workTypeCode: string,
    workTypeName: string,
    steps: [
        {
            id: string,
            workTypeId: string,
            workTypeName: string,
            fromStatusId: string,
            fromStatusCode: string,
            fromStatusName: string,
            toStatusId: string,
            toStatusCode: string,
            toStatusName: string,
            requiredRole: string,
            sortOrder: number
        }
    ]
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
    initial: boolean;
    terminal: boolean;
    review: boolean;
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
