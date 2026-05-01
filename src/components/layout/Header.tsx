'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';

export default function Header() {
    const { name, role } = useSelector((state: RootState) => state.auth);

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div className="text-sm text-slate-500">
                Система управления лабораторией
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="leading-none text-sm font-semibold text-slate-900">
                            {name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                            {role}
                        </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                        {name?.[0]}
                    </div>
                </div>
            </div>
        </header>
    );
}