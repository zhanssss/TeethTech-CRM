//types/order.types.ts
export type ImplantSource = 'clinic' | 'lab';

export type OrderTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

import type { OrderTaskStatus } from './task.types';

export interface OrderTask extends CreateOrderTask {
    id: string;
    orderId: string;
    status: OrderTaskStatus;
}

export interface CreateOrderTask {
    type: string;
    units: number;
    material: string;
    color: string;
    unitPrice: number;
    discount: number;
    impressionQty: number;
    transferQty: number;
    biteQty: number;
    analogQty: number;
    implantSystem: string;
    implantSize: string;
    implantQty: number;
    implantSource: ImplantSource;
    abutment: string;
    priority: OrderTaskPriority;
    operatorId: string;
    technicianId: string;
}

export interface CreateOrderPayload {
    id: string;
    clinicId: string;
    clinicName: string;
    patient: string;
    doctor: string;
    deadline: string;
    comment: string;
    tasks: OrderTask[];
    total: number;
    paid: number;
    unpaid: number;
    status: string;
}

export interface OrderListItem {
    id: string;
    orderNumber?: string;
    patient: string;
    clinic?: string;
    clinicName?: string;
    doctor: string;
    work?: string;
    workType?: string;
    deadline?: string;
    status: string;
    units?: number;
    color?: string;
    abutment?: string | number;
    impression?: boolean | number;
    transfer?: boolean | number;
    bite?: boolean | number;
    analog?: boolean | number;
    technician?: string;
    operator?: string;
    unitPrice?: number;
    discount?: number;
    total?: number;
    paid?: number;
    unpaid?: number;
    date?: string;
    clinicId?: string;
    comment?: string;
    tasks?: OrderTask[];
}

export interface OrderApiListItem {
    id: string;
    orderNumber: string;
    patientFullName: string;
    summaryWorkType: string;
    isActive: boolean;
    quantity: number;
    pricePerUnit: number;
    discount: number;
    totalPrice: number;
}

export interface CreateOrderTaskDto {
    workTypeId: string;
    quantity: number;
    toothNumbers: number[];
    orderId?: string;
    colorId: string;
    materialId: string;
    pricePerUnit: number;
    discountPercent: number;
}

export interface CreateOrderDto {
    clinicId: string;
    patientFullName: string;
    doctorFullName: string;
    deadline: string;
    dentalTechnicianId: string;
    cadCamOperatorId: string;
    comment: string;
    tasks: CreateOrderTaskDto[];
}

export interface OrderKanbanAssignee {
    id: string;
    fullName: string;
}

export interface OrderKanbanTask {
    id: string;
    taskNumber: string;
    workTypeName: string;
    materialName: string;
    colorCode: string;
    quantity: number;
    technician: OrderKanbanAssignee;
    operator: OrderKanbanAssignee;
    pricePerUnit: number;
    totalPrice: number;
}

export interface OrderKanbanColumn {
    statusId?: string;
    statusName: string;
    title: string;
    taskCount: number;
    tasks: OrderKanbanTask[];
}

export interface UpdateTaskStatusDto {
    nextStatusId: string;
    comment: string;
}

export interface UpdateTaskStatusArgs {
    taskId: string;
    body: UpdateTaskStatusDto;
}
