'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import CreateOrderModal from '@/src/components/Modals/CreateOrderModal';
import type {
    CreateOrderDto,
    CreateOrderResponse,
    OrderApiListItem,
    OrderListItem,
} from '@/src/types/order.types';
import type { TaskFileAttachmentType } from '@/src/types/task.types';
import { addOrder, useOrders } from '@/src/lib/ordersStore';
import {
    useCreateOrderMutation,
    useDeleteOrderMutation,
    useGetOrdersQuery,
} from '@/src/services/api/ordersApi';
import {
    useAbortMultipartTaskFileUploadMutation,
    useCompleteMultipartTaskFileUploadMutation,
    useInitMultipartTaskFileUploadMutation,
    useUploadMultipartTaskFilePartMutation,
    useUploadTaskFileMutation,
} from '@/src/services/api/taskFilesApi';

const DEFAULT_ORDER_SORT = 'deadline,ASC';
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SIMPLE_UPLOAD_LIMIT = 10 * 1024 * 1024;
const MULTIPART_CHUNK_SIZE = SIMPLE_UPLOAD_LIMIT;

type UploadTaskFileTrigger = ReturnType<typeof useUploadTaskFileMutation>[0];
type InitMultipartUploadTrigger = ReturnType<typeof useInitMultipartTaskFileUploadMutation>[0];
type UploadMultipartPartTrigger = ReturnType<typeof useUploadMultipartTaskFilePartMutation>[0];
type CompleteMultipartUploadTrigger = ReturnType<typeof useCompleteMultipartTaskFileUploadMutation>[0];
type AbortMultipartUploadTrigger = ReturnType<typeof useAbortMultipartTaskFileUploadMutation>[0];

function mapApiOrderToListItem(order: OrderApiListItem): OrderListItem {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        patient: order.patientFullName,
        doctor: '',
        work: order.summaryWorkType,
        workType: order.summaryWorkType,
        status: order.isActive ? 'Активен' : 'Закрыт',
        units: order.quantity,
        unitPrice: order.pricePerUnit,
        discount: order.discount,
        total: order.totalPrice,
        paid: 0,
        unpaid: order.totalPrice,
        date: new Date().toLocaleDateString('ru-RU'),
    };
}

function formatMoney(value?: number) {
    return `${(value ?? 0).toLocaleString('ru-RU')} ₸`;
}

function getStatusBadgeClass(status: string) {
    if (status === 'Активен') {
        return 'bg-emerald-100 text-emerald-700';
    }

    return 'bg-slate-100 text-slate-600';
}

function stripOrderFiles(payload: CreateOrderDto): CreateOrderDto {
    return {
        ...payload,
        tasks: payload.tasks.map((task) => ({
            workTypeId: task.workTypeId,
            quantity: task.quantity,
            toothNumbers: task.toothNumbers,
            orderId: task.orderId,
            colorId: task.colorId,
            materialId: task.materialId,
            pricePerUnit: task.pricePerUnit,
            discountPercent: task.discountPercent,
        })),
    };
}

async function uploadCreatedOrderFiles({
    payload,
    createdOrder,
    uploadTaskFile,
    initMultipartUpload,
    uploadMultipartPart,
    completeMultipartUpload,
    abortMultipartUpload,
}: {
    payload: CreateOrderDto;
    createdOrder: CreateOrderResponse;
    uploadTaskFile: UploadTaskFileTrigger;
    initMultipartUpload: InitMultipartUploadTrigger;
    uploadMultipartPart: UploadMultipartPartTrigger;
    completeMultipartUpload: CompleteMultipartUploadTrigger;
    abortMultipartUpload: AbortMultipartUploadTrigger;
}) {
    const hasFiles = payload.tasks.some(
        (task) => Boolean(task.images?.length || task.attachments?.length)
    );

    if (!hasFiles) return;

    const taskIds = createdOrder.taskIds ?? [];

    if (taskIds.length < payload.tasks.length) {
        throw new Error('Server did not return taskIds for every order task.');
    }

    for (let taskIndex = 0; taskIndex < payload.tasks.length; taskIndex += 1) {
        const task = payload.tasks[taskIndex];
        const taskId = taskIds[taskIndex];

        if (!taskId) continue;

        for (const image of task.images ?? []) {
            if (image.file) {
                await uploadOrderTaskFile({
                    taskId,
                    file: image.file,
                    type: 'SCREEN',
                    uploadTaskFile,
                    initMultipartUpload,
                    uploadMultipartPart,
                    completeMultipartUpload,
                    abortMultipartUpload,
                });
            }
        }

        for (const attachment of task.attachments ?? []) {
            if (attachment.file) {
                await uploadOrderTaskFile({
                    taskId,
                    file: attachment.file,
                    type: 'FILE',
                    uploadTaskFile,
                    initMultipartUpload,
                    uploadMultipartPart,
                    completeMultipartUpload,
                    abortMultipartUpload,
                });
            }
        }
    }
}

async function uploadOrderTaskFile({
    taskId,
    file,
    type,
    uploadTaskFile,
    initMultipartUpload,
    uploadMultipartPart,
    completeMultipartUpload,
    abortMultipartUpload,
}: {
    taskId: string;
    file: File;
    type: TaskFileAttachmentType;
    uploadTaskFile: UploadTaskFileTrigger;
    initMultipartUpload: InitMultipartUploadTrigger;
    uploadMultipartPart: UploadMultipartPartTrigger;
    completeMultipartUpload: CompleteMultipartUploadTrigger;
    abortMultipartUpload: AbortMultipartUploadTrigger;
}) {
    if (file.size < SIMPLE_UPLOAD_LIMIT) {
        await uploadTaskFile({
            taskId,
            file,
            type,
        }).unwrap();
        return;
    }

    const totalParts = Math.ceil(file.size / MULTIPART_CHUNK_SIZE);
    let multipartFileId = '';

    try {
        const multipartUpload = await initMultipartUpload({
            taskId,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            totalParts,
        }).unwrap();

        multipartFileId = multipartUpload.fileId;

        for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
            const start = (partNumber - 1) * MULTIPART_CHUNK_SIZE;
            const end = Math.min(start + MULTIPART_CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            await uploadMultipartPart({
                taskId,
                fileId: multipartUpload.fileId,
                partNumber,
                file: chunk,
                fileName: file.name,
            }).unwrap();
        }

        await completeMultipartUpload({
            taskId,
            fileId: multipartUpload.fileId,
        }).unwrap();
    } catch (error) {
        if (multipartFileId) {
            await abortMultipartUpload({
                taskId,
                fileId: multipartFileId,
            }).unwrap().catch(() => undefined);
        }

        throw error;
    }
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null && 'data' in error) {
        const data = (error as { data?: unknown }).data;

        if (typeof data === 'string') return data;

        if (typeof data === 'object' && data !== null) {
            const apiError = data as {
                detail?: unknown;
                error?: unknown;
                message?: unknown;
                title?: unknown;
            };

            for (const value of [
                apiError.detail,
                apiError.message,
                apiError.error,
                apiError.title,
            ]) {
                if (typeof value === 'string' && value.trim()) {
                    return value;
                }
            }
        }
    }

    return 'Unknown error';
}

export default function OrdersPage() {
    const localOrders = useOrders();
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
    const [deleteOrder, { isLoading: isDeletingOrder }] = useDeleteOrderMutation();
    const [uploadTaskFile] = useUploadTaskFileMutation();
    const [initMultipartUpload] = useInitMultipartTaskFileUploadMutation();
    const [uploadMultipartPart] = useUploadMultipartTaskFilePartMutation();
    const [completeMultipartUpload] = useCompleteMultipartTaskFileUploadMutation();
    const [abortMultipartUpload] = useAbortMultipartTaskFileUploadMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadingOrderFiles, setIsUploadingOrderFiles] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteError, setDeleteError] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
    const [sort, setSort] = useState(DEFAULT_ORDER_SORT);
    const {
        data: ordersPage,
        isFetching: isOrdersLoading,
        isError: isOrdersError,
    } = useGetOrdersQuery({
        page,
        size,
        sort,
    });

    const orders = useMemo(
        () => {
            if (ordersPage) {
                return ordersPage.content.map(mapApiOrderToListItem);
            }

            return isOrdersError ? localOrders : [];
        },
        [isOrdersError, localOrders, ordersPage]
    );

    const statuses = Array.from(new Set(orders.map((order) => order.status)));

    const filteredOrders = orders.filter((order) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            order.id.toLowerCase().includes(searchValue) ||
            (order.orderNumber ?? '').toLowerCase().includes(searchValue) ||
            order.patient.toLowerCase().includes(searchValue) ||
            (order.work ?? order.workType ?? '').toLowerCase().includes(searchValue) ||
            order.status.toLowerCase().includes(searchValue);

        const matchesStatus =
            statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setSort(DEFAULT_ORDER_SORT);
        setSize(DEFAULT_PAGE_SIZE);
        setPage(0);
    };

    const handleSizeChange = (nextSize: number) => {
        setSize(nextSize);
        setPage(0);
    };

    const handleSortChange = (nextSort: string) => {
        setSort(nextSort);
        setPage(0);
    };

    const handleCreateOrder = async (payload: CreateOrderDto) => {
        setDeleteError('');
        const createdOrder = await createOrder(stripOrderFiles(payload)).unwrap();

        addOrder(mapApiOrderToListItem(createdOrder));

        setIsUploadingOrderFiles(true);

        try {
            await uploadCreatedOrderFiles({
                payload,
                createdOrder,
                uploadTaskFile,
                initMultipartUpload,
                uploadMultipartPart,
                completeMultipartUpload,
                abortMultipartUpload,
            });
        } catch (error) {
            console.error('Order file upload failed:', error);
            setDeleteError(`Order created, but files were not uploaded: ${getErrorMessage(error)}`);
        } finally {
            setIsUploadingOrderFiles(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        const shouldDelete = window.confirm('Удалить заказ?');
        if (!shouldDelete) return;

        setDeleteError('');

        try {
            await deleteOrder(orderId).unwrap();
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            setDeleteError('Не удалось удалить заказ');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Реестр заказов</h1>
                    <p className="text-slate-500 text-sm">Управление производственным потоком лаборатории</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
                >
                    + Новый заказ
                </button>
            </div>

            {(isOrdersError || deleteError) && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
                    {deleteError || 'Не удалось загрузить заказы с сервера, показаны локальные данные.'}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск: ID, пациент, работа, статус"
                        className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">Все статусы</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="deadline,ASC">Срок: по возрастанию</option>
                        <option value="deadline,DESC">Срок: по убыванию</option>
                    </select>

                    <select
                        value={size}
                        onChange={(e) => handleSizeChange(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        {PAGE_SIZE_OPTIONS.map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize} на странице
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        На странице: <span className="font-bold text-slate-700">{filteredOrders.length}</span>
                        {ordersPage && (
                            <span className="text-slate-400"> из {ordersPage.numberOfElements}</span>
                        )}
                        {isOrdersLoading && <span className="ml-2 text-blue-600">Загрузка...</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={resetFilters}
                            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition"
                        >
                            Сбросить фильтры
                        </button>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <button
                                type="button"
                                disabled={isOrdersLoading || !ordersPage || ordersPage.first}
                                onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Назад
                            </button>
                            <span className="min-w-20 text-center">
                                Стр. {(ordersPage?.number ?? page) + 1}
                                {ordersPage?.totalPages ? ` из ${ordersPage.totalPages}` : ''}
                            </span>
                            <button
                                type="button"
                                disabled={isOrdersLoading || !ordersPage || ordersPage.last}
                                onClick={() => setPage((currentPage) => currentPage + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left lg:min-w-[980px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest">
                        <tr>
                            <th className="p-4 font-bold">ID</th>
                            <th className="p-4 font-bold">Пациент</th>
                            <th className="p-4 font-bold">Вид работы</th>
                            <th className="p-4 font-bold">Статус</th>
                            <th className="p-4 font-bold">Кол-во</th>
                            <th className="p-4 font-bold">Цена за ед.</th>
                            <th className="p-4 font-bold">Скидка</th>
                            <th className="p-4 font-bold">Итого</th>
                            <th className="p-4 font-bold text-right">Действия</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {isOrdersLoading && !ordersPage && (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-sm text-slate-400">
                                    Загрузка заказов...
                                </td>
                            </tr>
                        )}

                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition group">
                                <td className="p-4 text-sm font-mono text-slate-400">
                                    #{order.orderNumber ?? order.id}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-800">{order.patient}</td>
                                <td className="p-4 text-sm text-slate-600">{order.work}</td>
                                <td className="p-4">
                                    <span className={`${getStatusBadgeClass(order.status)} px-2 py-1 rounded-md text-[10px] font-bold uppercase`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{order.units}</td>
                                <td className="p-4 text-sm">{formatMoney(order.unitPrice)}</td>
                                <td className="p-4 text-sm">{(order.discount ?? 0).toLocaleString('ru-RU')}%</td>
                                <td className="p-4 text-sm font-bold">{formatMoney(order.total)}</td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                        >
                                            Открыть
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={isDeletingOrder}
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="text-red-600 hover:bg-red-600 hover:text-white border border-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {!isOrdersLoading && filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-sm text-slate-400">
                                    Заказы не найдены
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateOrderModal
                isOpen={isModalOpen}
                isSubmitting={isCreatingOrder || isUploadingOrderFiles}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />
        </div>
    );
}
