'use client';

import {useMemo, useState} from 'react';

import {useGetWorkTypesQuery} from '@/src/services/api/laboratory/workTypesApi';

import CreateWorkTypeStages from '@/src/components/Modals/CreateWorkTypeStages';
import ErrorState from '@/src/components/ui/ErrorState';

export default function LaboratoryWorkTypesPage() {
    const [stagesModalOpen, setStagesModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const {
        data: items = [],
        isLoading,
        isError,
    } = useGetWorkTypesQuery();

    const filteredItems = useMemo(() => {
        const query = search
            .trim()
            .toLocaleLowerCase('ru-RU');

        if (!query) {
            return items;
        }

        return items.filter((item) =>
            [
                item.name,
                item.code,
                item.description,
            ].some((value) =>
                value
                    ?.toLocaleLowerCase('ru-RU')
                    .includes(query),
            ),
        );
    }, [items, search]);

    const hasActivation = items.some(
        (item) => typeof item.isActive === 'boolean',
    );

    const activeCount = hasActivation
        ? items.filter((item) => item.isActive).length
        : items.length;

    const inactiveCount = hasActivation
        ? items.length - activeCount
        : 0;

    return (
        <>
            <main className="mx-auto min-h-full w-full max-w-[1600px] space-y-5 pb-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                            Лаборатория
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                            Типы работ
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Настройка типов работ и последовательности этапов производства
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStagesModalOpen(true)}
                        className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/15 transition hover:bg-violet-700 active:scale-95 sm:w-auto"
                    >
                        + Создать тип работы
                    </button>
                </header>

                <section
                    className={`grid gap-4 ${
                        hasActivation
                            ? 'sm:grid-cols-3'
                            : 'sm:grid-cols-2'
                    }`}
                >
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                Всего типов
                            </p>

                            <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                        </div>

                        <p className="mt-4 text-2xl font-black text-slate-950">
                            {items.length}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                            в справочнике лаборатории
                        </p>
                    </article>

                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                Доступно
                            </p>

                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </div>

                        <p className="mt-4 text-2xl font-black text-slate-950">
                            {activeCount}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                            активных типов работ
                        </p>
                    </article>

                    {hasActivation && (
                        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-500">
                                    Отключено
                                </p>

                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                            </div>

                            <p className="mt-4 text-2xl font-black text-slate-950">
                                {inactiveCount}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                                недоступно для выбора
                            </p>
                        </article>
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Список типов работ
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Показано: {filteredItems.length} из {items.length}
                            </p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Название, код или описание"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition hover:text-slate-700"
                                    aria-label="Очистить поиск"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {isLoading && (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {Array.from({length: 6}).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-36 animate-pulse rounded-2xl bg-slate-100"
                                    />
                                ))}
                            </div>
                        )}

                        {isError && (
                            <ErrorState compact>
                                Не удалось загрузить типы работ
                            </ErrorState>
                        )}

                        {!isLoading &&
                            !isError &&
                            items.length === 0 && (
                                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-black text-violet-600">
                                        +
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-slate-800">
                                        Типов работ пока нет
                                    </h3>

                                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                                        Создайте первый тип работы и настройте последовательность его этапов.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setStagesModalOpen(true)
                                        }
                                        className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
                                    >
                                        Создать тип работы
                                    </button>
                                </div>
                            )}

                        {!isLoading &&
                            !isError &&
                            items.length > 0 &&
                            filteredItems.length === 0 && (
                                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
                                    <h3 className="text-sm font-bold text-slate-700">
                                        Ничего не найдено
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Попробуйте изменить поисковый запрос.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="mt-3 rounded-lg px-3 py-2 text-xs font-bold text-violet-600 transition hover:bg-violet-50"
                                    >
                                        Очистить поиск
                                    </button>
                                </div>
                            )}

                        {!isLoading &&
                            !isError &&
                            filteredItems.length > 0 && (
                                <div className="grid max-h-[65dvh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:max-h-[650px] xl:grid-cols-3 [scrollbar-color:#8b5cf6_transparent]">
                                    {filteredItems.map((item) => (
                                        <article
                                            key={item.id}
                                            className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-black text-violet-700">
                                                        {item.name
                                                            .trim()
                                                            .charAt(0)
                                                            .toLocaleUpperCase(
                                                                'ru-RU',
                                                            )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-violet-700">
                                                            {item.name}
                                                        </h3>

                                                        {item.code && (
                                                            <p className="mt-1 truncate font-mono text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                                                {item.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {typeof item.isActive ===
                                                    'boolean' && (
                                                        <span
                                                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                                                                item.isActive
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                        {item.isActive
                                                            ? 'Активный'
                                                            : 'Отключён'}
                                                    </span>
                                                    )}
                                            </div>

                                            <div className="mt-4 flex-1">
                                                {item.description ? (
                                                    <p className="line-clamp-3 text-sm leading-5 text-slate-500">
                                                        {item.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm italic text-slate-400">
                                                        Описание не указано
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Тип работы
                                                </span>

                                                <span className="text-xs font-bold text-violet-600 opacity-0 transition group-hover:opacity-100">
                                                    Подробнее →
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                    </div>
                </section>
            </main>

            <CreateWorkTypeStages
                isOpen={stagesModalOpen}
                onClose={() => setStagesModalOpen(false)}
            />
        </>
    );
}