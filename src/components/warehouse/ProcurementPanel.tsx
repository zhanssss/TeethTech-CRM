'use client';

import { type FormEvent, useMemo, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import {
    useCreateProcurementOrderMutation,
    useGetNomenclatureQuery,
    useGetProcurementOrdersQuery,
    useGetProcurementSuppliersQuery,
    useReceiveProcurementOrderMutation,
    useSubmitProcurementOrderMutation,
    useUpsertProcurementSupplierMutation,
} from '@/src/services/api/warehouseApi';
import type {
    NomenclatureItem,
    ProcurementOrder,
    ProcurementOrderItem,
    ProcurementSupplier,
} from '@/src/types/warehouse.types';
import { formatDateTime, formatQuantity, getApiErrorMessage, shortId } from './warehouseUtils';

type ProcurementView = 'orders' | 'suppliers';

type OrderItemDraft = {
    key: string;
    nomenclatureId: string;
    quantity: string;
    unitPrice: string;
};

type ReceiptItemDraft = {
    quantity: string;
    lotNumber: string;
    expiresAt: string;
};

const PAGE_SIZE = 20;
const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white';

const orderStatusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    NEW: 'Новый',
    CREATED: 'Создан',
    SUBMITTED: 'Отправлен',
    IN_PROGRESS: 'В работе',
    PARTIALLY_RECEIVED: 'Частично принят',
    PARTIAL_RECEIPT: 'Частично принят',
    RECEIVED: 'Принят',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
    CANCELED: 'Отменён',
};

function normalizeOrderStatus(status: string) {
    return status.trim().toUpperCase();
}

function getOrderStatusLabel(status: string) {
    const normalized = normalizeOrderStatus(status);
    return orderStatusLabels[normalized] ?? status;
}

function getOrderStatusClasses(status: string) {
    const normalized = normalizeOrderStatus(status);
    if (['RECEIVED', 'COMPLETED'].includes(normalized)) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (['CANCELLED', 'CANCELED'].includes(normalized)) {
        return 'border-red-200 bg-red-50 text-red-700';
    }
    if (['PARTIALLY_RECEIVED', 'PARTIAL_RECEIPT'].includes(normalized)) {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    if (['SUBMITTED', 'IN_PROGRESS'].includes(normalized)) {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
    return 'border-slate-200 bg-slate-100 text-slate-700';
}

function isDraftOrder(order: ProcurementOrder) {
    return ['DRAFT', 'NEW', 'CREATED'].includes(normalizeOrderStatus(order.status));
}

function isTerminalOrder(order: ProcurementOrder) {
    return ['RECEIVED', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(
        normalizeOrderStatus(order.status)
    );
}

function getRemainingQuantity(item: ProcurementOrderItem) {
    return Math.max(0, item.orderedQuantity - item.receivedQuantity);
}

function formatMoney(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 2,
    }).format(value);
}

function getDefaultExpectedAt() {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function CreateOrderModal({
    suppliers,
    nomenclature,
    defaultWarehouseId,
    onClose,
    onCreated,
}: {
    suppliers: ProcurementSupplier[];
    nomenclature: NomenclatureItem[];
    defaultWarehouseId: string;
    onClose: () => void;
    onCreated: (order: ProcurementOrder) => void;
}) {
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState(defaultWarehouseId);
    const [expectedAt, setExpectedAt] = useState(getDefaultExpectedAt);
    const [items, setItems] = useState<OrderItemDraft[]>([
        { key: 'item-0', nomenclatureId: '', quantity: '', unitPrice: '0' },
    ]);
    const [nextItemKey, setNextItemKey] = useState(1);
    const [error, setError] = useState('');
    const [createOrder, createState] = useCreateProcurementOrderMutation();

    const estimatedTotal = items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        return sum + (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0);
    }, 0);

    const updateItem = (key: string, field: keyof Omit<OrderItemDraft, 'key'>, value: string) => {
        setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        setItems((current) => [
            ...current,
            { key: `item-${nextItemKey}`, nomenclatureId: '', quantity: '', unitPrice: '0' },
        ]);
        setNextItemKey((current) => current + 1);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!supplierId || !warehouseId.trim() || !expectedAt) {
            setError('Выберите поставщика и заполните склад и ожидаемую дату');
            return;
        }

        const parsedItems = items.map((item) => ({
            nomenclatureId: item.nomenclatureId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
        }));

        if (parsedItems.some((item) => !item.nomenclatureId || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
            setError('Для каждой позиции выберите номенклатуру и укажите количество больше нуля');
            return;
        }
        if (parsedItems.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
            setError('Цена позиции должна быть числом не меньше нуля');
            return;
        }
        if (new Set(parsedItems.map((item) => item.nomenclatureId)).size !== parsedItems.length) {
            setError('Одна номенклатурная позиция добавлена несколько раз');
            return;
        }

        const expectedDate = new Date(expectedAt);
        if (Number.isNaN(expectedDate.getTime())) {
            setError('Укажите корректную ожидаемую дату поставки');
            return;
        }

        try {
            const created = await createOrder({
                supplierId,
                warehouseId: warehouseId.trim(),
                expectedAt: expectedDate.toISOString(),
                items: parsedItems,
            }).unwrap();
            onCreated(created);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    return (
        <Modal contentClassName="max-w-5xl p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                    <h2 className="text-lg font-black text-slate-900">Новый заказ поставщику</h2>
                    <p className="mt-1 text-xs text-slate-500">После создания заказ сохранится как черновик</p>
                </div>
                <button type="button" onClick={onClose} disabled={createState.isLoading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto">
                <div className="space-y-5 p-5 sm:p-6">
                    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-1.5 text-sm font-bold text-slate-700">
                            <span>Поставщик</span>
                            <select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className={fieldClassName}>
                                <option value="">Выберите поставщика</option>
                                {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1.5 text-sm font-bold text-slate-700">
                            <span>UUID склада</span>
                            <input required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} placeholder="3fa85f64-…" className={fieldClassName} />
                        </label>
                        <label className="space-y-1.5 text-sm font-bold text-slate-700">
                            <span>Ожидаемая поставка</span>
                            <input required type="datetime-local" value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} className={fieldClassName} />
                        </label>
                    </div>

                    <section className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Позиции заказа</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Количество поддерживает дробные значения</p>
                            </div>
                            <button type="button" onClick={addItem} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50">+ Добавить</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <div key={item.key} className="grid gap-3 p-4 md:grid-cols-[minmax(260px,1fr)_150px_170px_40px] md:items-end">
                                    <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                        <span>Номенклатура {index + 1}</span>
                                        <select required value={item.nomenclatureId} onChange={(event) => updateItem(item.key, 'nomenclatureId', event.target.value)} className={fieldClassName}>
                                            <option value="">Выберите позицию</option>
                                            {nomenclature.map((position) => (
                                                <option key={position.id} value={position.id}>{position.code} · {position.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                        <span>Количество</span>
                                        <input required type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => updateItem(item.key, 'quantity', event.target.value)} className={fieldClassName} />
                                    </label>
                                    <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                        <span>Цена за единицу</span>
                                        <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.key, 'unitPrice', event.target.value)} className={fieldClassName} />
                                    </label>
                                    <button type="button" aria-label="Удалить позицию" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((currentItem) => currentItem.key !== item.key))} className="h-10 rounded-xl text-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30">×</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-slate-500">Предварительная сумма: <strong className="text-slate-900">{formatMoney(estimatedTotal)}</strong></p>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} disabled={createState.isLoading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Отмена</button>
                        <button type="submit" disabled={createState.isLoading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{createState.isLoading ? 'Создаём…' : 'Создать заказ'}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function SupplierModal({
    supplier,
    onClose,
    onSaved,
}: {
    supplier?: ProcurementSupplier;
    onClose: () => void;
    onSaved: (supplier: ProcurementSupplier) => void;
}) {
    const [id] = useState(() => supplier?.id ?? crypto.randomUUID());
    const [name, setName] = useState(supplier?.name ?? '');
    const [bin, setBin] = useState(supplier?.bin ?? '');
    const [phone, setPhone] = useState(supplier?.phone ?? '');
    const [email, setEmail] = useState(supplier?.email ?? '');
    const [active, setActive] = useState(supplier?.active ?? true);
    const [error, setError] = useState('');
    const [upsertSupplier, upsertState] = useUpsertProcurementSupplierMutation();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        if (!name.trim() || !bin.trim()) {
            setError('Заполните название поставщика и БИН');
            return;
        }
        try {
            const saved = await upsertSupplier({
                id,
                name: name.trim(),
                bin: bin.trim(),
                phone: phone.trim(),
                email: email.trim(),
                active,
            }).unwrap();
            onSaved(saved);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    return (
        <Modal>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-black text-slate-900">{supplier ? 'Редактировать поставщика' : 'Новый поставщик'}</h2>
                    <p className="mt-1 text-xs text-slate-500">Контактные данные для закупок и поставок</p>
                </div>
                <button type="button" onClick={onClose} disabled={upsertState.isLoading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <label className="block space-y-1.5 text-sm font-bold text-slate-700">
                    <span>Название</span>
                    <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="ТОО МедСнаб" className={fieldClassName} />
                </label>
                <label className="block space-y-1.5 text-sm font-bold text-slate-700">
                    <span>БИН</span>
                    <input required value={bin} onChange={(event) => setBin(event.target.value)} placeholder="12 цифр" inputMode="numeric" className={fieldClassName} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5 text-sm font-bold text-slate-700">
                        <span>Телефон</span>
                        <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 700 000 00 00" className={fieldClassName} />
                    </label>
                    <label className="block space-y-1.5 text-sm font-bold text-slate-700">
                        <span>Email</span>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="orders@example.kz" className={fieldClassName} />
                    </label>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 accent-blue-600" />
                    Поставщик активен
                </label>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={onClose} disabled={upsertState.isLoading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Отмена</button>
                    <button type="submit" disabled={upsertState.isLoading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{upsertState.isLoading ? 'Сохраняем…' : 'Сохранить'}</button>
                </div>
            </form>
        </Modal>
    );
}

function ReceiptModal({
    order,
    onClose,
    onReceived,
}: {
    order: ProcurementOrder;
    onClose: () => void;
    onReceived: (order: ProcurementOrder) => void;
}) {
    const [items, setItems] = useState<Record<string, ReceiptItemDraft>>(() =>
        Object.fromEntries(order.items.map((item) => [
            item.id,
            { quantity: '', lotNumber: '', expiresAt: '' },
        ]))
    );
    const [error, setError] = useState('');
    const [receiveOrder, receiveState] = useReceiveProcurementOrderMutation();

    const updateItem = (itemId: string, field: keyof ReceiptItemDraft, value: string) => {
        setItems((current) => ({
            ...current,
            [itemId]: { ...current[itemId], [field]: value },
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const selectedItems = order.items.flatMap((orderItem) => {
            const draft = items[orderItem.id];
            const quantity = Number(draft.quantity);
            if (!draft.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0) return [];
            return [{
                itemId: orderItem.id,
                quantity,
                lotNumber: draft.lotNumber.trim(),
                expiresAt: draft.expiresAt,
                remaining: getRemainingQuantity(orderItem),
            }];
        });

        if (selectedItems.length === 0) {
            setError('Укажите принятое количество хотя бы для одной позиции');
            return;
        }
        if (selectedItems.some((item) => item.quantity > item.remaining)) {
            setError('Нельзя принять больше оставшегося количества');
            return;
        }
        if (selectedItems.some((item) => !item.lotNumber || !item.expiresAt)) {
            setError('Для принимаемых позиций укажите номер партии и срок годности');
            return;
        }

        try {
            const received = await receiveOrder({
                id: order.id,
                body: {
                    items: selectedItems.map(({ itemId, quantity, lotNumber, expiresAt }) => ({
                        itemId,
                        quantity,
                        lotNumber,
                        expiresAt,
                    })),
                },
            }).unwrap();
            onReceived(received);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    return (
        <Modal contentClassName="max-w-5xl p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                    <h2 className="text-lg font-black text-slate-900">Приёмка заказа {order.number || `#${shortId(order.id)}`}</h2>
                    <p className="mt-1 text-xs text-slate-500">Можно принять весь заказ или только часть позиций</p>
                </div>
                <button type="button" onClick={onClose} disabled={receiveState.isLoading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto">
                <div className="space-y-4 p-5 sm:p-6">
                    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                    <div className="space-y-3">
                        {order.items.map((item) => {
                            const remaining = getRemainingQuantity(item);
                            const disabled = remaining <= 0;
                            return (
                                <article key={item.id} className={`rounded-2xl border p-4 ${disabled ? 'border-slate-100 bg-slate-50 opacity-65' : 'border-slate-200'}`}>
                                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">#{shortId(item.id)}</p>
                                        </div>
                                        <p className="text-xs text-slate-500">Заказано {formatQuantity(item.orderedQuantity)} · принято {formatQuantity(item.receivedQuantity)} · осталось <strong className="text-slate-900">{formatQuantity(remaining)}</strong></p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                            <span>Принято сейчас</span>
                                            <input disabled={disabled} type="number" min="0" max={remaining} step="0.0001" value={items[item.id].quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} placeholder="0" className={fieldClassName} />
                                        </label>
                                        <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                            <span>Номер партии</span>
                                            <input disabled={disabled} value={items[item.id].lotNumber} onChange={(event) => updateItem(item.id, 'lotNumber', event.target.value)} placeholder="LOT-2026-001" className={fieldClassName} />
                                        </label>
                                        <label className="space-y-1.5 text-xs font-bold text-slate-600">
                                            <span>Срок годности</span>
                                            <input disabled={disabled} type="date" value={items[item.id].expiresAt} onChange={(event) => updateItem(item.id, 'expiresAt', event.target.value)} className={fieldClassName} />
                                        </label>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                    <button type="button" onClick={onClose} disabled={receiveState.isLoading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Отмена</button>
                    <button type="submit" disabled={receiveState.isLoading} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{receiveState.isLoading ? 'Принимаем…' : 'Провести приёмку'}</button>
                </div>
            </form>
        </Modal>
    );
}

function OrderDetailModal({
    order,
    actionLoading,
    onClose,
    onSubmit,
    onReceive,
}: {
    order: ProcurementOrder;
    actionLoading: boolean;
    onClose: () => void;
    onSubmit: () => void;
    onReceive: () => void;
}) {
    const remainingTotal = order.items.reduce((sum, item) => sum + getRemainingQuantity(item), 0);
    const canSubmit = isDraftOrder(order);
    const canReceive = remainingTotal > 0 && !isDraftOrder(order) && !isTerminalOrder(order);

    return (
        <Modal contentClassName="max-w-5xl p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">Заказ {order.number || `#${shortId(order.id)}`}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getOrderStatusClasses(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Поставщик: {order.supplierName || `#${shortId(order.supplierId)}`}</p>
                </div>
                <button type="button" onClick={onClose} disabled={actionLoading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['Ожидается', formatDateTime(order.expectedAt)],
                        ['Принят', formatDateTime(order.receivedAt)],
                        ['UUID склада', order.warehouseId],
                        ['Сумма', formatMoney(order.totalAmount)],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                            <p className="mt-1 break-all text-sm font-bold text-slate-800">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[720px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-bold">Позиция</th>
                                <th className="px-4 py-3 font-bold">Заказано</th>
                                <th className="px-4 py-3 font-bold">Принято</th>
                                <th className="px-4 py-3 font-bold">Осталось</th>
                                <th className="px-4 py-3 text-right font-bold">Цена</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatQuantity(item.orderedQuantity)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatQuantity(item.receivedQuantity)}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{formatQuantity(getRemainingQuantity(item))}</td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatMoney(item.unitPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button type="button" onClick={onClose} disabled={actionLoading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Закрыть</button>
                {canSubmit && <button type="button" onClick={onSubmit} disabled={actionLoading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{actionLoading ? 'Отправляем…' : 'Отправить в работу'}</button>}
                {canReceive && <button type="button" onClick={onReceive} disabled={actionLoading} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Принять поставку</button>}
            </div>
        </Modal>
    );
}

export default function ProcurementPanel() {
    const [view, setView] = useState<ProcurementView>('orders');
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [createOrderOpen, setCreateOrderOpen] = useState(false);
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<ProcurementSupplier | undefined>();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<ProcurementOrder | null>(null);

    const ordersQuery = useGetProcurementOrdersQuery({ page, size: PAGE_SIZE });
    const suppliersQuery = useGetProcurementSuppliersQuery();
    const nomenclatureQuery = useGetNomenclatureQuery({ activeOnly: true, page: 0, size: 1000 });
    const [submitOrder, submitState] = useSubmitProcurementOrderMutation();

    const orders = useMemo(
        () => ordersQuery.data?.content ?? [],
        [ordersQuery.data?.content]
    );
    const suppliers = suppliersQuery.data ?? [];
    const selectedOrder = orders.find((order) => order.id === selectedOrderId);
    const defaultWarehouseId = orders.find((order) => order.warehouseId)?.warehouseId ?? '';
    const filteredOrders = useMemo(() => {
        const needle = search.trim().toLocaleLowerCase('ru-RU');
        if (!needle) return orders;
        return orders.filter((order) =>
            `${order.number} ${order.supplierName} ${order.status}`.toLocaleLowerCase('ru-RU').includes(needle)
        );
    }, [orders, search]);
    const draftCount = orders.filter(isDraftOrder).length;
    const receivableCount = orders.filter((order) => !isDraftOrder(order) && !isTerminalOrder(order)).length;
    const loadError = ordersQuery.error ?? suppliersQuery.error ?? nomenclatureQuery.error;

    const handleSubmitOrder = async () => {
        if (!selectedOrder) return;
        try {
            await submitOrder(selectedOrder.id).unwrap();
            setSelectedOrderId(null);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    return (
        <div className="space-y-5">
            {loadError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {getApiErrorMessage(loadError, 'Не удалось загрузить закупки')}
                </div>
            )}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Всего заказов', ordersQuery.data?.totalElements ?? '—', 'На всех страницах'],
                    ['Черновики', draftCount, 'На текущей странице'],
                    ['Ожидают приёмки', receivableCount, 'В работе сейчас'],
                    ['Поставщики', suppliers.length, `${suppliers.filter((supplier) => supplier.active).length} активных`],
                ].map(([label, value, note]) => (
                    <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500">{label}</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{note}</p>
                    </article>
                ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
                        {([
                            ['orders', 'Заказы'],
                            ['suppliers', 'Поставщики'],
                        ] as Array<[ProcurementView, string]>).map(([id, label]) => (
                            <button key={id} type="button" onClick={() => setView(id)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
                        ))}
                    </div>

                    {view === 'orders' ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Номер, поставщик или статус" className={`${fieldClassName} sm:w-64`} />
                            <button type="button" onClick={() => setCreateOrderOpen(true)} disabled={suppliers.length === 0 || (nomenclatureQuery.data?.length ?? 0) === 0} title={suppliers.length === 0 ? 'Сначала добавьте поставщика' : undefined} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">+ Новый заказ</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => { setEditingSupplier(undefined); setSupplierModalOpen(true); }} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700">+ Новый поставщик</button>
                    )}
                </div>

                {view === 'orders' ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3 font-bold">Заказ</th>
                                        <th className="px-5 py-3 font-bold">Поставщик</th>
                                        <th className="px-5 py-3 font-bold">Поставка</th>
                                        <th className="px-5 py-3 font-bold">Прогресс</th>
                                        <th className="px-5 py-3 font-bold">Сумма</th>
                                        <th className="px-5 py-3 text-right font-bold">Статус</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.map((order) => {
                                        const ordered = order.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
                                        const received = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                                        const progress = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
                                        return (
                                            <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="cursor-pointer transition hover:bg-blue-50/40">
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-black text-slate-900">{order.number || `#${shortId(order.id)}`}</p>
                                                    <p className="mt-1 text-[10px] font-bold text-slate-400">{order.items.length} позиций</p>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-bold text-slate-700">{order.supplierName || `#${shortId(order.supplierId)}`}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(order.expectedAt)}</td>
                                                <td className="px-5 py-4">
                                                    <div className="w-32">
                                                        <div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>{formatQuantity(received)} / {formatQuantity(ordered)}</span><span>{progress}%</span></div>
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-bold text-slate-700">{formatMoney(order.totalAmount)}</td>
                                                <td className="px-5 py-4 text-right"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getOrderStatusClasses(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {ordersQuery.isLoading && <div className="px-5 py-16 text-center text-sm text-slate-500">Загружаем заказы…</div>}
                        {!ordersQuery.isLoading && filteredOrders.length === 0 && <div className="px-5 py-16 text-center text-sm text-slate-500">{search ? 'Заказы по запросу не найдены' : 'Заказов поставщикам пока нет'}</div>}

                        {(ordersQuery.data?.totalPages ?? 0) > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                                <p className="text-xs text-slate-500">Страница {page + 1} из {ordersQuery.data?.totalPages}</p>
                                <div className="flex gap-2">
                                    <button type="button" disabled={ordersQuery.data?.first || ordersQuery.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Назад</button>
                                    <button type="button" disabled={ordersQuery.data?.last || ordersQuery.isFetching} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Далее</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                            {suppliers.map((supplier) => (
                                <article key={supplier.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-sm font-black text-slate-900">{supplier.name}</h3>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supplier.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{supplier.active ? 'Активен' : 'Неактивен'}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">БИН {supplier.bin || '—'}</p>
                                        </div>
                                        <button type="button" onClick={() => { setEditingSupplier(supplier); setSupplierModalOpen(true); }} className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700">Изменить</button>
                                    </div>
                                    <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                                        <p>{supplier.phone || 'Телефон не указан'}</p>
                                        <p className="truncate">{supplier.email || 'Email не указан'}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {suppliersQuery.isLoading && <div className="px-5 py-16 text-center text-sm text-slate-500">Загружаем поставщиков…</div>}
                        {!suppliersQuery.isLoading && suppliers.length === 0 && <div className="px-5 py-16 text-center text-sm text-slate-500">Поставщиков пока нет. Добавьте первого, чтобы создать заказ.</div>}
                    </>
                )}
            </section>

            {createOrderOpen && (
                <CreateOrderModal
                    suppliers={suppliers}
                    nomenclature={nomenclatureQuery.data ?? []}
                    defaultWarehouseId={defaultWarehouseId}
                    onClose={() => setCreateOrderOpen(false)}
                    onCreated={() => {
                        setCreateOrderOpen(false);
                    }}
                />
            )}
            {supplierModalOpen && (
                <SupplierModal
                    key={editingSupplier?.id ?? 'new'}
                    supplier={editingSupplier}
                    onClose={() => setSupplierModalOpen(false)}
                    onSaved={() => {
                        setSupplierModalOpen(false);
                    }}
                />
            )}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    actionLoading={submitState.isLoading}
                    onClose={() => setSelectedOrderId(null)}
                    onSubmit={handleSubmitOrder}
                    onReceive={() => {
                        setReceiptOrder(selectedOrder);
                        setSelectedOrderId(null);
                    }}
                />
            )}
            {receiptOrder && (
                <ReceiptModal
                    order={receiptOrder}
                    onClose={() => setReceiptOrder(null)}
                    onReceived={() => {
                        setReceiptOrder(null);
                    }}
                />
            )}
        </div>
    );
}
