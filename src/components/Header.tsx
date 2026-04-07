'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';

export default function Header() {
    // Вытаскиваем данные пользователя из Redux
    const { name, role, isAuthenticated } = useSelector((state: RootState) => state.auth);

    return (
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
            <div className="text-slate-500 text-sm">
                {/* Здесь можно выводить хлебные крошки или поиск */}
                Система управления лабораторией
            </div>

            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900 leading-none">{name}</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{role}</p>
                        </div>
                        {/* Круглый аватар с инициалом */}
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {name?.[0]}
                        </div>
                    </div>
                ) : (
                    <button className="text-sm font-medium text-blue-600">Войти в систему</button>
                )}
            </div>
        </header>
    );
}