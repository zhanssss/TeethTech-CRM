'use client';

import { useSyncExternalStore } from 'react';
import { mockOrders } from '@/src/mock/orders';
import type { CreateOrderTask, OrderListItem, OrderTask } from '@/src/types/order.types';
import type { TaskStatus } from '@/src/types/employee.types';

const STORAGE_KEY = 'teeth-tech-orders';
const TASK_STATUSES: TaskStatus[] = ['TODO', 'MODELING', 'MILLING', 'POST_PROCESSING', 'DONE'];

type OrdersListener = () => void;

const listeners = new Set<OrdersListener>();
let cachedOrders: OrderListItem[] = mockOrders.map((order) => normalizeOrder(order));

function isBrowser() {
    return typeof window !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isStoredOrder(value: unknown): value is OrderListItem {
    if (!isRecord(value)) return false;
    return typeof value.id === 'string' && typeof value.patient === 'string';
}

function numberFrom(value: unknown, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function quantityFrom(value: unknown) {
    if (typeof value === 'boolean') return value ? 1 : 0;
    return numberFrom(value, 0);
}

function taskStatusFrom(value: unknown): TaskStatus {
    if (typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus)) {
        return value as TaskStatus;
    }

    if (value === 'IN_PROGRESS') return 'MODELING';
    return 'TODO';
}

function normalizeTask(task: Partial<OrderTask> & Partial<CreateOrderTask>, orderId: string, index: number): OrderTask {
    return {
        id: task.id ?? `${orderId}-task-${index + 1}`,
        orderId,
        type: task.type ?? '',
        units: numberFrom(task.units, 1),
        material: task.material ?? '',
        color: task.color ?? '',
        unitPrice: numberFrom(task.unitPrice),
        discount: numberFrom(task.discount),
        impressionQty: numberFrom(task.impressionQty),
        transferQty: numberFrom(task.transferQty),
        biteQty: numberFrom(task.biteQty),
        analogQty: numberFrom(task.analogQty),
        implantSystem: task.implantSystem ?? '',
        implantSize: task.implantSize ?? '',
        implantQty: numberFrom(task.implantQty),
        implantSource: task.implantSource ?? 'clinic',
        abutment: task.abutment ?? '',
        priority: task.priority ?? 'medium',
        operatorId: task.operatorId ?? '',
        technicianId: task.technicianId ?? '',
        status: taskStatusFrom(task.status),
    };
}

function createFallbackTask(order: OrderListItem): OrderTask {
    return normalizeTask(
        {
            id: `${order.id}-task-1`,
            orderId: order.id,
            type: order.work ?? order.workType ?? '',
            units: order.units ?? 1,
            color: order.color ?? '',
            unitPrice: order.unitPrice ?? order.total ?? 0,
            discount: order.discount ?? 0,
            impressionQty: quantityFrom(order.impression),
            transferQty: quantityFrom(order.transfer),
            biteQty: quantityFrom(order.bite),
            analogQty: quantityFrom(order.analog),
            abutment: String(order.abutment ?? ''),
            operatorId: order.operator ?? '',
            technicianId: order.technician ?? '',
            status: taskStatusFrom(order.status),
        },
        order.id,
        0
    );
}

export function normalizeOrder(order: OrderListItem): OrderListItem {
    const tasks = order.tasks?.length
        ? order.tasks.map((task, index) => normalizeTask(task, order.id, index))
        : [createFallbackTask(order)];

    const work = order.work ?? order.workType ?? tasks.map((task) => task.type).filter(Boolean).join(', ');
    const units = order.units ?? tasks.reduce((sum, task) => sum + task.units, 0);
    const total = order.total ?? tasks.reduce((sum, task) => {
        const subtotal = task.units * task.unitPrice;
        return sum + Math.max(subtotal - subtotal * (task.discount / 100), 0);
    }, 0);

    return {
        ...order,
        clinic: order.clinic ?? order.clinicName,
        work,
        workType: order.workType ?? work,
        units,
        unitPrice: order.unitPrice ?? tasks[0]?.unitPrice,
        discount: order.discount ?? tasks[0]?.discount,
        total,
        paid: order.paid ?? 0,
        unpaid: order.unpaid ?? total - (order.paid ?? 0),
        tasks,
    };
}

function readOrdersFromStorage() {
    if (!isBrowser()) return null;

    try {
        const rawOrders = window.localStorage.getItem(STORAGE_KEY);
        if (!rawOrders) return null;

        const parsedOrders = JSON.parse(rawOrders) as unknown;
        if (!Array.isArray(parsedOrders)) return null;

        return parsedOrders.filter(isStoredOrder).map((order) => normalizeOrder(order));
    } catch {
        return null;
    }
}

function writeOrdersToStorage(orders: OrderListItem[]) {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.map((order) => normalizeOrder(order))));
}

function notifyListeners() {
    listeners.forEach((listener) => listener());
}

let isInitialized = false;

function getOrdersSnapshot() {
    if (!isInitialized) {
        const storedOrders = readOrdersFromStorage();

        if (storedOrders) {
            cachedOrders = storedOrders;
        }

        isInitialized = true;
    }

    return cachedOrders;
}

function getServerOrdersSnapshot() {
    return cachedOrders;
}

function subscribeOrders(listener: OrdersListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useOrders() {
    return useSyncExternalStore(subscribeOrders, getOrdersSnapshot, getServerOrdersSnapshot);
}

export function setOrders(orders: OrderListItem[]) {
    cachedOrders = orders.map((order) => normalizeOrder(order));
    writeOrdersToStorage(cachedOrders);
    notifyListeners();
}

export function addOrder(order: OrderListItem) {
    setOrders([normalizeOrder(order), ...getOrdersSnapshot()]);
}

export function updateOrderTasks(orderId: string, tasks: OrderTask[]) {
    setOrders(
        getOrdersSnapshot().map((order) =>
            order.id === orderId
                ? normalizeOrder({ ...order, tasks })
                : order
        )
    );
}
