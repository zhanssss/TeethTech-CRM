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
