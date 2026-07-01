'use client';

import { type FormEvent, useMemo, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import {
    useGetNomenclatureItemQuery,
    useGetNomenclatureQuery,
    useGetStockBalanceQuery,
    useReceiveStockMutation,
} from '@/src/services/api/warehouseApi';
import { formatQuantity, getApiErrorMessage } from './warehouseUtils';

export default function NomenclaturePanel() {
    const [activeOnly, setActiveOnly] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const listQuery = useGetNomenclatureQuery({ activeOnly });
    const detailQuery = useGetNomenclatureItemQuery(selectedId ?? '', { skip: !selectedId });
    const balanceQuery = useGetStockBalanceQuery(selectedId ?? '', { skip: !selectedId });
    const [receiveStock, receiveState] = useReceiveStockMutation();

    const filteredItems = useMemo(() => {
        const needle = search.trim().toLocaleLowerCase('ru-RU');
        if (!needle) return listQuery.data ?? [];
        return (listQuery.data ?? []).filter((item) =>
            `${item.code} ${item.name}`.toLocaleLowerCase('ru-RU').includes(needle)
        );
    }, [listQuery.data, search]);

    const selectedFromList = listQuery.data?.find((item) => item.id === selectedId);
    const selectedItem = detailQuery.data ?? selectedFromList;

    const openItem = (id: string) => {
        setSelectedId(id);
        setQuantity('');
        setReason('');
        setFormError('');
        setSuccessMessage('');
    };

    const closeItem = () => {
        if (receiveState.isLoading) return;
        setSelectedId(null);
    };

    const handleReceive = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedId) return;
        setFormError('');
        setSuccessMessage('');

        const parsedQuantity = Number(quantity);
        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            setFormError('Количество должно быть больше нуля');
            return;
        }
        if (!reason.trim()) {
            setFormError('Укажите основание прихода: поставщика, накладную или комментарий');
            return;
        }

        try {
            await receiveStock({
                nomenclatureId: selectedId,
                body: { quantity: parsedQuantity, reason: reason.trim() },
            }).unwrap();
            setQuantity('');
            setReason('');
            setSuccessMessage('Приход проведён. Остаток обновлён.');
        } catch (error) {
            setFormError(getApiErrorMessage(error, 'Не удалось провести приход'));
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Номенклатура склада</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Текущие остатки и минимальные уровни по каждой позиции
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="relative block">
                            <span className="sr-only">Поиск по номенклатуре</span>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                                <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                            </svg>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Код или название"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:w-64"
                            />
                        </label>

                        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600">
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(event) => setActiveOnly(event.target.checked)}
                                className="h-4 w-4 accent-blue-600"
                            />
                            Только активные
                        </label>
                    </div>
                </div>

                {listQuery.isError && (
                    <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {getApiErrorMessage(listQuery.error, 'Не удалось загрузить номенклатуру')}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-bold">Код</th>
                                <th className="px-5 py-3 font-bold">Наименование</th>
                                <th className="px-5 py-3 font-bold">Остаток</th>
                                <th className="px-5 py-3 font-bold">Минимум</th>
                                <th className="px-5 py-3 font-bold">Состояние</th>
                                <th className="px-5 py-3 text-right font-bold">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.map((item) => {
                                const low = item.currentStock <= item.minStockLevel;
                                return (
                                    <tr key={item.id} className="transition hover:bg-blue-50/30">
                                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">{item.code}</td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                            <p className="mt-0.5 text-xs text-slate-400">Единица: {item.unit}</p>
                                        </td>
                                        <td className={`px-5 py-4 text-sm font-black ${low ? 'text-red-600' : 'text-slate-800'}`}>
                                            {formatQuantity(item.currentStock, item.unit)}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {formatQuantity(item.minStockLevel, item.unit)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.active ? 'Активна' : 'Неактивна'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openItem(item.id)}
                                                className="rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                            >
                                                Открыть / приход
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {listQuery.isLoading && (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">Загружаем позиции…</div>
                )}
                {!listQuery.isLoading && filteredItems.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                        По заданным условиям ничего не найдено
                    </div>
                )}
            </section>

            {selectedId && (
                <Modal contentClassName="max-w-2xl p-0">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Карточка позиции</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-900">
                                {selectedItem?.name ?? 'Загрузка…'}
                            </h2>
                            {selectedItem && (
                                <p className="mt-1 font-mono text-xs text-slate-400">{selectedItem.code}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={closeItem}
                            aria-label="Закрыть"
                            className="text-2xl leading-none text-slate-400 transition hover:text-slate-700"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="space-y-5 p-5 sm:p-6">
                        {detailQuery.isError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {getApiErrorMessage(detailQuery.error, 'Номенклатура не найдена')}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Текущий остаток</p>
                                <p className="mt-1 text-xl font-black text-slate-900">
                                    {balanceQuery.isFetching
                                        ? '…'
                                        : formatQuantity(balanceQuery.data ?? selectedItem?.currentStock, selectedItem?.unit)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Минимальный уровень</p>
                                <p className="mt-1 text-xl font-black text-slate-900">
                                    {formatQuantity(selectedItem?.minStockLevel, selectedItem?.unit)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Статус</p>
                                <p className={`mt-1 text-sm font-bold ${selectedItem?.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {selectedItem?.active ? 'Активна' : 'Неактивна'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleReceive} className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                            <div>
                                <h3 className="font-bold text-slate-900">Провести ручной приход</h3>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                    Внимание: операция не идемпотентна. Повторная отправка повторно увеличит остаток.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                                <label>
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Количество</span>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={quantity}
                                            onChange={(event) => setQuantity(event.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none focus:border-blue-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            {selectedItem?.unit}
                                        </span>
                                    </div>
                                </label>
                                <label>
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Основание</span>
                                    <input
                                        required
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                        placeholder="Например: накладная №348 от поставщика"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </label>
                            </div>

                            {formError && (
                                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{formError}</p>
                            )}
                            {successMessage && (
                                <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">{successMessage}</p>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={receiveState.isLoading || !selectedItem?.active}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {receiveState.isLoading ? 'Проводим…' : 'Провести приход'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
}
