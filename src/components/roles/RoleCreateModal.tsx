'use client';

import { FormEvent, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import { useCreateRoleMutation } from '@/src/services/api/rolesApi';
import type { Role } from '@/src/types/role.types';

const ROLE_CODE_PATTERN = /^[A-Z0-9_]+$/u;

export function normalizeRoleCode(value: string) {
    return value
        .toUpperCase()
        .replace(/^ROLE_/u, '')
        .replace(/[^A-Z0-9_]/gu, '')
        .slice(0, 45);
}

type RoleCreateModalProps = {
    onClose: () => void;
    onCreated?: (role: Role) => void;
};

export default function RoleCreateModal({ onClose, onCreated }: RoleCreateModalProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [validationError, setValidationError] = useState('');
    const [createRole, { isLoading }] = useCreateRoleMutation();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoading) return;

        const normalizedName = name.trim();
        const normalizedCode = normalizeRoleCode(code);

        if (!normalizedName) {
            setValidationError('Укажите название роли.');
            return;
        }
        if (!normalizedCode || !ROLE_CODE_PATTERN.test(normalizedCode)) {
            setValidationError('Код может содержать только латинские буквы, цифры и подчёркивание.');
            return;
        }

        setValidationError('');
        try {
            const createdRole = await createRole({
                name: normalizedName,
                code: normalizedCode,
            }).unwrap();
            setName('');
            setCode('');
            onCreated?.(createdRole);
            onClose();
        } catch (error) {
            console.error('Role create failed:', error);
        }
    };

    return (
        <Modal contentClassName="max-w-lg overflow-hidden p-0">
            <form onSubmit={handleSubmit}>
                <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Производственная роль</p>
                            <h2 className="mt-1 text-xl font-black text-slate-950">Создать новую роль</h2>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100" aria-label="Закрыть">×</button>
                    </div>
                </header>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Название роли</span>
                        <input
                            autoFocus
                            required
                            maxLength={255}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Оператор печати металла"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Код роли</span>
                        <span className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-violet-500 focus-within:bg-white">
                            <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 font-mono text-sm font-bold text-slate-500">ROLE_</span>
                            <input
                                required
                                maxLength={45}
                                value={code}
                                onChange={(event) => setCode(normalizeRoleCode(event.target.value))}
                                placeholder="METAL_PRINTER"
                                className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm uppercase outline-none"
                            />
                        </span>
                        <span className="mt-2 block text-xs text-slate-500">Код используется в workflow и не изменяется после создания.</span>
                    </label>

                    {validationError && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{validationError}</p>
                    )}
                </div>

                <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
                    <button type="button" onClick={onClose} disabled={isLoading} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50">Отмена</button>
                    <button type="submit" disabled={isLoading || !name.trim() || !code} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        {isLoading ? 'Создание...' : 'Создать роль'}
                    </button>
                </footer>
            </form>
        </Modal>
    );
}
