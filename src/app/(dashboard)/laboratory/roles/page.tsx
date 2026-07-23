'use client';

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import RoleCreateModal from '@/src/components/roles/RoleCreateModal';
import Modal from '@/src/components/ui/Modal';
import QueryErrorNotice from '@/src/components/ui/QueryErrorNotice';
import type { RootState } from '@/src/lib/store';
import {
    useDeleteRoleMutation,
    useGetRolesQuery,
    useUpdateRoleMutation,
} from '@/src/services/api/rolesApi';
import type { Role } from '@/src/types/role.types';

function normalizedJwtRoles(roles: string[]) {
    return roles.map((role) => role.toUpperCase().replace(/^ROLE_/u, ''));
}

function deleteUnavailableReason(role: Role) {
    if (role.systemManaged) return 'Системную роль удалить нельзя';
    if (role.assignedUsers > 0) return `Роль назначена сотрудникам: ${role.assignedUsers}`;
    if (role.workflowSteps > 0) return `Роль используется в workflow: ${role.workflowSteps} переходов`;
    return 'Backend запретил удаление этой роли';
}

function RoleSkeleton() {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Загрузка ролей">
            {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
        </div>
    );
}

function RoleCounters({ role }: { role: Role }) {
    return (
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                Сотрудники: {role.assignedUsers}
            </span>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                Переходы workflow: {role.workflowSteps}
            </span>
        </div>
    );
}

export default function RolesManagementPage() {
    const jwtRoles = useSelector((state: RootState) => state.auth.roles);
    const normalizedRoles = normalizedJwtRoles(jwtRoles);
    const isAdmin = normalizedRoles.includes('ADMIN');
    const canView = isAdmin || normalizedRoles.includes('CHIEF_TECHNICIAN');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [editingName, setEditingName] = useState('');
    const {
        data: roles = [],
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetRolesQuery(undefined, { skip: !canView });
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

    const groupedRoles = useMemo(() => {
        const byName = (left: Role, right: Role) => left.name.localeCompare(right.name, 'ru');
        return {
            system: roles.filter((role) => role.systemManaged).sort(byName),
            production: roles.filter((role) => !role.systemManaged).sort(byName),
        };
    }, [roles]);

    if (!canView) {
        return (
            <section className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
                <h1 className="text-lg font-black text-red-800">Недостаточно прав</h1>
                <p className="mt-2 text-sm text-red-700">Список ролей доступен администратору и главному технику.</p>
            </section>
        );
    }

    const openEditor = (role: Role) => {
        if (!isAdmin || role.systemManaged) return;
        setEditingRole(role);
        setEditingName(role.name);
    };

    const saveRoleName = async () => {
        if (!editingRole || isUpdating || !editingName.trim()) return;
        try {
            await updateRole({
                roleId: editingRole.id,
                body: { name: editingName.trim() },
            }).unwrap();
            setEditingRole(null);
        } catch (error) {
            if ((error as FetchBaseQueryError)?.status === 404) void refetch();
            console.error('Role update failed:', error);
        }
    };

    const handleDelete = async (role: Role) => {
        if (!isAdmin || role.systemManaged || !role.deletable || isDeleting) return;
        const confirmed = window.confirm(
            `Удалить роль “${role.name}”? Восстановить роль автоматически будет невозможно`
        );
        if (!confirmed) return;

        try {
            await deleteRole(role.id).unwrap();
        } catch (error) {
            if ((error as FetchBaseQueryError)?.status === 404) void refetch();
            console.error('Role delete failed:', error);
        }
    };

    const renderRole = (role: Role) => (
        <article key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {role.systemManaged && (
                            <span title="Управляется системой" aria-label="Системная роль" className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm">🔒</span>
                        )}
                        <h3 className="truncate font-bold text-slate-950">{role.name}</h3>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-400">{role.code}</p>
                    {role.systemManaged && <p className="mt-2 text-xs font-semibold text-slate-500">Управляется системой</p>}
                    <div className="mt-3"><RoleCounters role={role} /></div>
                </div>

                {role.systemManaged ? (
                    <span title="Системная роль управляется backend и не может быть изменена" className="inline-flex cursor-help items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                        Изменение недоступно
                    </span>
                ) : isAdmin ? (
                    <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => openEditor(role)} disabled={isUpdating || isDeleting} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            Изменить название
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDelete(role)}
                            disabled={!role.deletable || isDeleting || isUpdating}
                            title={role.deletable ? 'Удалить роль' : deleteUnavailableReason(role)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                            {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                    </div>
                ) : null}
            </div>
        </article>
    );

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-10">
            <header className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Лаборатория → Роли</p>
                    <h1 className="mt-1 text-3xl font-black text-slate-950">Роли</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">Системные права защищены backend. Производственные роли можно назначать сотрудникам и переходам workflow.</p>
                </div>
                {isAdmin && (
                    <button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700">
                        + Создать роль
                    </button>
                )}
            </header>

            {isError && (
                <QueryErrorNotice message="Не удалось загрузить список ролей." onRetry={() => void refetch()} isRetrying={isFetching} />
            )}

            {isLoading ? <RoleSkeleton /> : (
                <>
                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-950">Системные роли</h2>
                            <p className="mt-1 text-xs text-slate-500">Поставляются и управляются backend.</p>
                        </div>
                        {groupedRoles.system.map(renderRole)}
                        {groupedRoles.system.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">Системных ролей нет.</p>}
                    </section>

                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-950">Производственные роли</h2>
                            <p className="mt-1 text-xs text-slate-500">Используются при назначении сотрудников и настройке workflow.</p>
                        </div>
                        {groupedRoles.production.map(renderRole)}
                        {groupedRoles.production.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">Производственные роли ещё не созданы.</p>}
                    </section>
                </>
            )}

            {isCreateOpen && <RoleCreateModal onClose={() => setIsCreateOpen(false)} />}

            {editingRole && (
                <Modal contentClassName="max-w-md p-0">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-black text-slate-950">Изменить название роли</h2>
                        <p className="mt-1 font-mono text-xs text-slate-400">{editingRole.code}</p>
                    </div>
                    <div className="px-5 py-5">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Название</span>
                            <input autoFocus required maxLength={255} value={editingName} onChange={(event) => setEditingName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white" />
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                        <button type="button" onClick={() => setEditingRole(null)} disabled={isUpdating} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Отмена</button>
                        <button type="button" onClick={() => void saveRoleName()} disabled={isUpdating || !editingName.trim()} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:bg-slate-300">
                            {isUpdating ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
