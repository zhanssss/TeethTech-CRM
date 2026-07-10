'use client';

import {type FormEvent, useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useSelector} from 'react-redux';
import TaskDetailsSidebar from '@/src/components/layout/TaskDetailsSidebar';
import {RootState} from '@/src/lib/store';
import type {Task} from '@/src/types/task.types';
import type {OrderApiListItem, OrderDetails, OrderKanbanColumn, OrderKanbanTask} from '@/src/types/order.types';
import type {User} from '@/src/types/user.types';
import ErrorModal from '@/src/components/ui/ErrorModal';
import {
    useGetOrderQuery,
    useGetOrderKanbanQuery,
    useGetOrdersQuery,
    useAssignTaskMutation,
    useUpdateOrderMutation,
} from '@/src/services/api/ordersApi';
import {useGetUsersQuery} from '@/src/services/api/usersApi';

const ORDER_LOOKUP_PARAMS = {
    page: 0,
    size: 100,
    sort: 'deadline,ASC',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined) {
    return Boolean(value && UUID_PATTERN.test(value));
}

type ServerOrderInfo = OrderApiListItem | OrderDetails;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getNameValue(value: unknown) {
    if (typeof value === 'string') return value;

    if (!isRecord(value)) return '';

    const name = value.name ?? value.fullName;

    return typeof name === 'string' ? name : '';
}

function getStringValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return '';

    for (const key of keys) {
        const value = source[key];
        const nameValue = getNameValue(value);

        if (nameValue) return nameValue;
    }

    return '';
}

function getNumberValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return 0;

    for (const key of keys) {
        const value = source[key];

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const numericValue = Number(value);

            if (Number.isFinite(numericValue)) {
                return numericValue;
            }
        }
    }

    return 0;
}

function collectUnique(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function getOrderDetailTasks(order?: ServerOrderInfo) {
    if (!isRecord(order) || !Array.isArray(order.tasks)) return [];

    return order.tasks.filter(isRecord) as unknown as OrderKanbanTask[];
}

function getColumnsTasks(columns: OrderKanbanColumn[]) {
    return columns.flatMap((column) => column.tasks);
}

function getTaskTechnicianName(task: OrderKanbanTask) {
    return task.dentalTechnicianFullName || task.technician?.fullName || '';
}

function getTaskOperatorName(task: OrderKanbanTask) {
    return task.cadCamOperatorFullName || task.operator?.fullName || '';
}

function getTaskColor(task: OrderKanbanTask) {
    return task.colorCode || getStringValue(task, ['colorName', 'color']);
}

function normalizeRoleValue(value: string | undefined | null) {
    return (value ?? '').toLowerCase().replace(/[-_/]+/g, ' ');
}

function getUserRoleValues(user: User) {
    return [
        user.role,
        ...(user.roles ?? []),
        user.specialization,
    ].filter((value): value is string => Boolean(value));
}

function filterUsersByRole(users: User[], tokens: string[]) {
    const normalizedTokens = tokens.map(normalizeRoleValue);

    return users.filter((user) => {
        const normalizedUserRoles = getUserRoleValues(user)
            .map(normalizeRoleValue)
            .join(' ');

        return normalizedTokens.some((token) =>
            normalizedUserRoles.includes(token)
        );
    });
}

function getUserLabel(user: User) {
    const meta = getUserRoleValues(user).join(' / ');
    return meta ? `${user.fullName} (${meta})` : user.fullName;
}

type AssignmentStage = {
    label: string;
    roleTokens: string[];
};

function getAssignmentStage(column: OrderKanbanColumn): AssignmentStage | null {
    const value = normalizeRoleValue(`${column.statusName} ${column.title}`);

    if (value.includes('order closed') || value.includes('закрыт')) {
        return null;
    }

    if (value.includes('waiting for approval') || (value.includes('ожидани') && value.includes('провер'))) {
        return {
            label: 'Диспетчер',
            roleTokens: ['ROLE_DISPATCHER', 'dispatcher', 'диспетчер'],
        };
    }

    if (value.includes('prosthetist work') || value.includes('протезист')) {
        return {
            label: 'Протезист',
            roleTokens: ['ROLE_PROSTHETIST', 'prosthetist', 'протезист'],
        };
    }

    if (value.includes('plastering') || value.includes('гипсов')) {
        return {
            label: 'Гипсовщик',
            roleTokens: ['ROLE_PLASTERER', 'plasterer', 'гипсовщик'],
        };
    }

    if (value.includes('scanning') || value.includes('сканир')) {
        return {
            label: 'Сканировщик',
            roleTokens: ['ROLE_SCANNER', 'scanner', 'сканировщик'],
        };
    }

    if (value.includes('modeling') || value.includes('моделир')) {
        return {
            label: 'Оператор',
            roleTokens: ['ROLE_OPERATOR', 'operator', 'моделировщик', 'оператор'],
        };
    }

    if (value.includes('ceramics') || value.includes('керами')) {
        return {
            label: 'Керамист',
            roleTokens: ['ROLE_CERAMIST', 'ceramist', 'керамист'],
        };
    }

    if (value.includes('todo') || value.includes('новая задач')) {
        return {
            label: 'Диспетчер',
            roleTokens: ['ROLE_DISPATCHER', 'dispatcher', 'диспетчер'],
        };
    }

    return null;
}

function getAssigneeId(value: unknown) {
    if (!isRecord(value)) return '';

    return typeof value.id === 'string' ? value.id : '';
}

function getAssigneeIdValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return '';

    for (const key of keys) {
        const id = getAssigneeId(source[key]);

        if (id) return id;
    }

    return '';
}

function getTaskTechnicianId(task: OrderKanbanTask) {
    return task.technician?.id || getStringValue(task, ['dentalTechnicianId', 'technicianId']);
}

function getTaskOperatorId(task: OrderKanbanTask) {
    return task.operator?.id || getStringValue(task, ['cadCamOperatorId', 'operatorId']);
}

function getTaskAssignedUserId(task: OrderKanbanTask, stage: AssignmentStage) {
    const assignedUserId = task.assignedUser?.id
        || task.assignedUserId
        || getStringValue(task, ['attachedUserId']);

    if (assignedUserId) return assignedUserId;

    if (stage.roleTokens.includes('ROLE_OPERATOR')) {
        return getTaskOperatorId(task);
    }

    if (stage.roleTokens.includes('ROLE_CERAMIST')) {
        return getTaskTechnicianId(task);
    }

    return '';
}

function ColumnAssigneeSelect({
                                  orderId,
                                  column,
                                  users,
                                  canAssign,
                                  isUsersLoading,
                              }: {
    orderId: string;
    column: OrderKanbanColumn;
    users: User[];
    canAssign: boolean;
    isUsersLoading: boolean;
}) {
    const stage = getAssignmentStage(column);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assignmentError, setAssignmentError] = useState('');
    const [assignTask, {isLoading: isAssigning}] = useAssignTaskMutation();

    if (!stage) return null;

    const eligibleUsers = filterUsersByRole(users, stage.roleTokens)
        .filter((user) => user.status !== 'FIRED');
    const assignedUserIds = Array.from(new Set(
        column.tasks
            .map((task) => getTaskAssignedUserId(task, stage))
            .filter(Boolean)
    ));
    const currentAssignedUserId = assignedUserIds.length === 1 ? assignedUserIds[0] : '';
    const selectValue = selectedUserId || currentAssignedUserId;
    const selectedUser = users.find((user) => user.id === selectValue);
    const options = selectedUser && !eligibleUsers.some((user) => user.id === selectedUser.id)
        ? [selectedUser, ...eligibleUsers]
        : eligibleUsers;
    const isEmpty = column.tasks.length === 0;

    const handleChange = async (userId: string) => {
        if (!userId || isEmpty) return;

        setAssignmentError('');

        try {
            const tasksToAssign = column.tasks.filter(
                (task) => getTaskAssignedUserId(task, stage) !== userId
            );

            await Promise.all(
                tasksToAssign.map((task) =>
                    assignTask({taskId: task.id, userId, orderId}).unwrap()
                )
            );
            setSelectedUserId(userId);
        } catch (error) {
            console.error('Task assignment failed:', error);
            setAssignmentError('Не удалось назначить сотрудника');
        }
    };

    if (!canAssign) {
        return (
            <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {stage.label}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                    {selectedUser?.fullName || (assignedUserIds.length > 1 ? 'Несколько исполнителей' : 'Не назначен')}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-3 border-t border-slate-200 pt-3">
            <label className="block">
                <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Ответственный · {stage.label}
                </span>
                <select
                    value={selectValue}
                    disabled={isUsersLoading || isAssigning || isEmpty}
                    onChange={(event) => void handleChange(event.target.value)}
                    className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                    <option value="">
                        {isEmpty
                            ? 'Нет задач для назначения'
                            : assignedUserIds.length > 1
                                ? 'Несколько исполнителей'
                                : 'Выберите сотрудника'}
                    </option>
                    {options.map((user) => (
                        <option key={user.id} value={user.id}>
                            {getUserLabel(user)}
                        </option>
                    ))}
                </select>
            </label>
            {assignmentError && (
                <p className="mt-1.5 text-[10px] font-semibold text-red-600">
                    {assignmentError}
                </p>
            )}
        </div>
    );
}

function mapOrderKanbanTaskToDetailsTask(task: OrderKanbanTask, order?: ServerOrderInfo): Task {
    const quantity = Number(task.quantity || 0);
    const total = Number(task.totalAmount ?? task.totalPrice ?? 0);

    return {
        id: task.id,
        orderId: task.orderId,
        title: task.workTypeName || task.taskNumber || task.workTypeCode || task.id,
        status: task.currentStatusFormName || task.currentStatusCode || '-',
        patient: getStringValue(order, ['patientFullName', 'patientName', 'patient']),
        deadline: getStringValue(order, ['deadline']),
        type: task.workTypeName || task.workTypeCode,
        material: task.materialName,
        color: task.colorCode,
        taskType: task.taskType,
        technicianId: task.dentalTechnicianFullName || task.technician?.fullName || '',
        operatorId: task.cadCamOperatorFullName || task.operator?.fullName || '',
        units: quantity,
        unitPrice: Number(task.pricePerUnit ?? (quantity ? total / quantity : 0)),
        discount: 0,
    };
}

export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const {role, roles} = useSelector((state: RootState) => state.auth);
    const canAssignTasks = role === 'ADMIN'
        || role === 'DISPATCHER'
        || roles.some((userRole) => ['ROLE_ADMIN', 'ROLE_DISPATCHER'].includes(userRole));
    const {data: serverOrders, isLoading: isServerOrdersLoading} = useGetOrdersQuery(ORDER_LOOKUP_PARAMS);
    const {data: serverOrderDetails, isLoading: isServerOrderLoading} = useGetOrderQuery(
        id,
        {skip: !isUuid(id)}
    );
    const {data: users = [], isLoading: isUsersLoading} = useGetUsersQuery(undefined, {skip: !isUuid(id)});
    const temporaryKanbanUserId = useMemo(
        () => users.find((user) => isUuid(user.id))?.id,
        [users]
    );
    const canLoadServerKanban = isUuid(id) && Boolean(temporaryKanbanUserId);
    const {data: serverKanbanColumns, isLoading: isKanbanLoading} = useGetOrderKanbanQuery(
        {id, userId: temporaryKanbanUserId ?? ''},
        {skip: !canLoadServerKanban}
    );
    const serverOrder = serverOrderDetails ?? serverOrders?.content.find((item) => item.id === id);
    const isPageLoading = isServerOrdersLoading || isServerOrderLoading || isUsersLoading || isKanbanLoading;

    if (isPageLoading) {
        return <div className="text-sm text-slate-500">Загрузка заказа...</div>;
    }

    if (serverOrder || serverKanbanColumns) {
        return (
            <ServerKanbanBoard
                orderId={id}
                order={serverOrder}
                columns={serverKanbanColumns ?? []}
                users={users}
                isUsersLoading={isUsersLoading}
                canAssignTasks={canAssignTasks}
            />
        );
    }

    return (
        <ErrorModal title="Заказ не найден" isDismissible={false}>
            <div className="space-y-4">
                <p>Проверь ID заказа или вернись в реестр.</p>
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                >
                    ← Реестр заказов
                </Link>
            </div>
        </ErrorModal>
    );
}

function ServerKanbanBoard({
                               orderId,
                               order,
                               columns,
                               users,
                               isUsersLoading,
                               canAssignTasks,
                           }: {
    orderId: string;
    order?: ServerOrderInfo;
    columns: OrderKanbanColumn[];
    users: User[];
    isUsersLoading: boolean;
    canAssignTasks: boolean;
}) {
    const taskCount = columns.reduce((sum, column) => sum + column.taskCount, 0);
    const [selectedTask, setSelectedTask] = useState<OrderKanbanTask | null>(null);
    const [assignmentForm, setAssignmentForm] = useState({
        dentalTechnicianId: '',
        cadCamOperatorId: '',
    });
    const [assignmentError, setAssignmentError] = useState('');
    const [updateOrder, {isLoading: isUpdatingAssignments}] = useUpdateOrderMutation();
    const allTasks = [...getColumnsTasks(columns), ...getOrderDetailTasks(order)];
    const patientName = getStringValue(order, ['patientFullName', 'patientName', 'patient']);
    const clinicName = getStringValue(order, ['clinicName', 'clinic']);
    const doctorName = getStringValue(order, ['doctorFullName', 'doctorName', 'doctor']);
    const workTypeName = getStringValue(order, ['summaryWorkType', 'workTypeName', 'workType', 'work']);
    const quantity = getNumberValue(order, ['quantity']) || allTasks.reduce((sum, task) => sum + Number(task.quantity || 0), 0);
    const totalPrice = getNumberValue(order, ['totalPrice', 'totalAmount']) || allTasks.reduce((sum, task) => sum + Number(task.totalAmount ?? task.totalPrice ?? 0), 0);
    const colors = collectUnique(allTasks.map(getTaskColor));
    const technicians = collectUnique([
        getStringValue(order, ['dentalTechnicianFullName', 'dentalTechnician', 'technician']),
        ...allTasks.map(getTaskTechnicianName),
    ]);
    const operators = collectUnique([
        getStringValue(order, ['cadCamOperatorFullName', 'operatorFullName', 'cadCamOperator', 'operator']),
        ...allTasks.map(getTaskOperatorName),
    ]);
    const currentTechnicianId = getAssigneeIdValue(order, ['dentalTechnician', 'technician'])
        || allTasks.map(getTaskTechnicianId).find(Boolean)
        || '';
    const currentOperatorId = getAssigneeIdValue(order, ['cadCamOperator', 'operator'])
        || allTasks.map(getTaskOperatorId).find(Boolean)
        || '';
    const selectedTechnicianId = assignmentForm.dentalTechnicianId || currentTechnicianId;
    const selectedOperatorId = assignmentForm.cadCamOperatorId || currentOperatorId;
    const filteredTechnicianOptions = filterUsersByRole(users, ['керамист', 'зуб техник', 'technician', 'ceramist', 'dental technician', 'ROLE_CERAMIST']);
    const selectedTechnician = users.find((user) => user.id === selectedTechnicianId);
    const technicianOptions = selectedTechnician && !filteredTechnicianOptions.some((user) => user.id === selectedTechnician.id)
        ? [selectedTechnician, ...filteredTechnicianOptions]
        : filteredTechnicianOptions;
    const filteredOperatorOptions = filterUsersByRole(users, ['cad', 'cam', 'оператор', 'operator', 'моделировщик', 'modeler', 'ROLE_OPERATOR']);
    const selectedOperator = users.find((user) => user.id === selectedOperatorId);
    const operatorOptions = selectedOperator && !filteredOperatorOptions.some((user) => user.id === selectedOperator.id)
        ? [selectedOperator, ...filteredOperatorOptions]
        : filteredOperatorOptions;
    const hasAssignmentChanges =
        selectedTechnicianId !== currentTechnicianId ||
        selectedOperatorId !== currentOperatorId;
    const isActive = isRecord(order) && typeof order.isActive === 'boolean' ? order.isActive : true;
    const selectedDetailsTask = selectedTask ? mapOrderKanbanTaskToDetailsTask(selectedTask, order) : null;

    const handleAssignmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAssignmentError('');

        try {
            await updateOrder({
                id: orderId,
                body: {
                    dentalTechnicianId: selectedTechnicianId,
                    cadCamOperatorId: selectedOperatorId,
                },
            }).unwrap();
        } catch (error) {
            console.error('Order assignment update failed:', error);
            setAssignmentError('Не удалось обновить команду заказа');
        }
    };

    return (
        <>
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col space-y-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link
                            href="/orders"
                            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider"
                        >
                            ← Реестр заказов
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                            Заказ #{order?.orderNumber ?? orderId}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span
                            className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {isActive ? 'Активен' : 'Закрыт'}
                        </span>
                    </div>
                </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                    className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 md:col-span-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Пациент</p>
                        <p className="font-bold text-slate-800 text-lg">{patientName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Клиника</p>
                        <p className="text-blue-600 text-sm font-semibold">{clinicName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Врач</p>
                        <p className="text-slate-700 text-sm font-medium">{doctorName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Вид работы</p>
                        <p className="text-slate-700 text-sm font-medium">{workTypeName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Кол-во</p>
                        <p className="text-slate-700 text-sm font-medium">{quantity} ед.</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Итого</p>
                        <p className="font-black text-slate-900 text-lg">
                            {totalPrice.toLocaleString('ru-RU')} ₸
                        </p>
                    </div>
                </div>

                <div
                    className="flex flex-col justify-between rounded-2xl bg-slate-900 p-4 text-white shadow-lg sm:p-5">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Цвет</p>
                        <p className="mt-2 text-xl font-black text-orange-400">
                            {colors.length ? colors.join(', ') : '-'}
                        </p>
                    </div>
                    <p className="mt-4 border-t border-slate-800 pt-4 text-sm font-semibold text-slate-100">
                        {taskCount} задач на доске
                    </p>
                </div>
            </div>

            <div
                className="grid grid-cols-1 items-start gap-x-10 gap-y-10 pb-8 pt-4 lg:grid-cols-3">
                {columns.map((column) => (
                    <section
                        key={`${column.statusName}-${column.title}`}
                        className="h-fit min-h-[280px] rounded-xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/60 shadow-sm"
                    >
                        <div className="rounded-t-xl border-b border-slate-200 bg-white/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                                    {column.title || column.statusName}
                                </h2>
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                                    {column.taskCount}
                                </span>
                            </div>
                            <ColumnAssigneeSelect
                                orderId={orderId}
                                column={column}
                                users={users}
                                canAssign={canAssignTasks}
                                isUsersLoading={isUsersLoading}
                            />
                        </div>

                        <div className="min-h-[150px] space-y-3 p-3">
                            {column.tasks.map((task) => (
                                <button
                                    type="button"
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3 text-left transition hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {task.taskNumber ?? task.workTypeCode ?? task.id.slice(0, 8)}
                                        </span>
                                        <span className="text-slate-400 italic">{task.quantity} ед.</span>
                                    </div>

                                    <div>
                                        <h3 className="text-slate-900 font-semibold text-sm">
                                            {task.workTypeName}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {task.materialName || 'Материал не указан'}
                                            {task.colorCode ? ` · цвет ${task.colorCode}` : ''}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                        <div>
                                            <p className="font-bold uppercase text-slate-400">Техник</p>
                                            <p className="font-semibold text-slate-700">
                                                {task.dentalTechnicianFullName || task.technician?.fullName || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase text-slate-400">Статус</p>
                                            <p className="font-semibold text-slate-700">
                                                {task.currentStatusFormName || task.currentStatusCode || task.operator?.fullName || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                        <span className="text-[10px] text-slate-400">
                                            {task.toothNumbers?.length ? `Зубы: ${task.toothNumbers.join(', ')}` : 'Зубы не указаны'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800">
                                            {(task.totalAmount ?? task.totalPrice ?? 0).toLocaleString('ru-RU')} ₸
                                        </span>
                                    </div>
                                </button>
                            ))}

                            {column.tasks.length === 0 && (
                                <div className="py-8 text-center text-xs italic text-slate-400">
                                    Пусто
                                </div>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>

        <TaskDetailsSidebar
            task={selectedDetailsTask}
            onClose={() => setSelectedTask(null)}
        />
        </>
    );
}
