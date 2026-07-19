'use client';

import TelegramBotAdminPanel from '@/src/components/settings/TelegramBotAdminPanel';
import type { RootState } from '@/src/lib/store';
import { useSelector } from 'react-redux';

export default function IntegrationsSettingsPage() {
    const role = useSelector((state: RootState) => state.auth.role);

    if (role !== 'ADMIN') {
        return <TelegramBotAdminPanel />;
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Администрирование</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Интеграции</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Настройка внешних сервисов TeethTech CRM.</p>
            </header>

            <TelegramBotAdminPanel />
        </div>
    );
}
