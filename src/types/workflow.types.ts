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
