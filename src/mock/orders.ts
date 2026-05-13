import type { OrderListItem } from '@/src/types/order.types';

export const mockOrders: OrderListItem[] = [
    {
        id: '101',
        patient: 'Алиев К.',
        clinic: 'Dental Care',
        doctor: 'Смирнов А.В.',
        workType: 'Коронка цирконий',
        deadline: '2026-04-12',
        status: 'IN_PROGRESS',
        units: 2,
        color: "A2",
        abutment: 0,
        impression: 0,
        bite: 0,
        technician: "z",
        operator: "b",
        unitPrice: 25000,
        discount: 10,
        total: 45000.
    },
];
