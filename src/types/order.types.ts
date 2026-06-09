//types/order.types.ts
export type ImplantSource = 'clinic' | 'lab';

export type OrderTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

import type {
    OrderTaskStatus,
    TaskAttachment,
    TaskComment,
    TaskImage,
} from './task.types';

export type Sort = {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
}

export type PageableInfo = {
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: Sort;
    unpaged: boolean;
    offset: number
}

export interface OrderGetApiResponse {
    pageable: PageableInfo;
    first: boolean;
    sort: Sort;
    number: number;
    numberOfElements: number;
    last: boolean;
    size: number;
    content: OrderApiListItem[];
    empty: boolean;
    totalElements?: number;
    totalPages?: number;
}

export interface OrderTask extends CreateOrderTask {
    id: string;
    orderId: string;
    status: OrderTaskStatus;
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
    images?: TaskImage[];
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
    attachments?: TaskAttachment[];
    images?: TaskImage[];
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

export type CreateOrderTaskRequest = Omit<CreateOrderTaskDto, 'attachments' | 'images'>;

export interface CreateOrderRequest extends Omit<CreateOrderDto, 'tasks'> {
    tasks: CreateOrderTaskRequest[];
}

export interface UpdateOrderDto {
    deadline: string;
    comment: string;
}

export interface UpdateOrderArgs {
    id: string;
    body: UpdateOrderDto;
}

export interface GetOrderKanbanArgs {
    id: string;
    userId: string;
}

export interface OrderKanbanAssignee {
    id: string;
    fullName: string;
}

export interface OrderKanbanTask {
    id: string;
    orderId: string;
    workTypeName: string;
    workTypeCode: string;
    materialName: string;
    colorCode: string;
    quantity: number;
    totalAmount: number;
    currentStatusFormName: string;
    currentStatusCode: string;
    dentalTechnicianFullName: string;
    toothNumbers: number[];
    allowedNextStatusIds: string[];
    taskNumber?: string;
    technician?: OrderKanbanAssignee;
    operator?: OrderKanbanAssignee;
    pricePerUnit?: number;
    totalPrice?: number;
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
