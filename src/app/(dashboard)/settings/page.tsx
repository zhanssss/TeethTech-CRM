import TelegramNotificationsCard from '@/src/components/settings/TelegramNotificationsCard';

export default function SettingsPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Личный кабинет
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    Настройки профиля
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Управляйте личными каналами уведомлений TeethTech CRM.
                </p>
            </header>

            <TelegramNotificationsCard />
        </div>
    );
}
