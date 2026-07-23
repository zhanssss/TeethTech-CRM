'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '@/src/lib/store';

type GuideRole = 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN' | 'FINANCIER' | 'CHIEF_TECHNICIAN';
type GuideKind = 'orders' | 'tasks' | 'materials' | 'payroll' | 'workflow';

type Guide = {
    id: string;
    kind: GuideKind;
    category: string;
    title: string;
    result: string;
    path: string;
    href: string;
    duration: string;
    roles: GuideRole[];
    steps: Array<{
        title: string;
        action: string;
        example: string;
        check: string;
    }>;
};

const roleNames: Record<string, string> = {
    ADMIN: 'Администратор',
    DISPATCHER: 'Диспетчер',
    TECHNICIAN: 'Техник',
    FINANCIER: 'Финансист',
    CHIEF_TECHNICIAN: 'Главный техник',
    HEAD_TECHNICIAN: 'Главный техник',
};

const guides: Guide[] = [
    {
        id: 'create-order',
        kind: 'orders',
        category: 'Заказы',
        title: 'Создать заказ без ошибок',
        result: 'В CRM появится заказ с пациентом, сроком и отдельными задачами для каждой работы.',
        path: 'Заказы → Реестр → Создать заказ',
        href: '/orders',
        duration: '5 минут',
        roles: ['ADMIN', 'DISPATCHER'],
        steps: [
            {
                title: 'Укажите заказчика',
                action: 'Выберите клинику. После этого выберите врача и пациента из подсказок, укажите срок.',
                example: 'Клиника «Dental Pro» · врач Ахметова А. · пациент Иванов И. · срок 28 июля',
                check: 'Все четыре поля заполнены, кнопка «Продолжить» стала активной.',
            },
            {
                title: 'Создайте отдельную задачу на каждую работу',
                action: 'Выберите вид работы, цвет, материал, зубы и количество. Для другой технологии нажмите «Добавить ещё техническую задачу».',
                example: 'Коронка циркониевая · A2 · цирконий · зуб 16 · 1 шт.',
                check: 'У каждой работы зелёная точка готовности.',
            },
            {
                title: 'Добавьте файлы именно к нужной работе',
                action: 'Фотографии положите в «Фотографии и скрины», STL и документы — в «Документы и файлы».',
                example: 'Задача 1: photo_16.jpg и scan_upper.stl',
                check: 'Названия файлов видны внутри карточки выбранной работы.',
            },
            {
                title: 'Проверьте итог',
                action: 'На шаге «Проверка» сверьте пациента, срок, список работ и сумму. Затем создайте заказ.',
                example: '2 работы · 48 000 ₸ · срок 28 июля',
                check: 'После создания заказ появился в реестре.',
            },
        ],
    },
    {
        id: 'process-task',
        kind: 'tasks',
        category: 'Моя работа',
        title: 'Принять, выполнить и передать задачу',
        result: 'Задача корректно перейдёт на следующий производственный этап и попадёт нужному сотруднику.',
        path: 'Рабочая зона → нужная задача',
        href: '/employee',
        duration: '3 минуты',
        roles: ['TECHNICIAN', 'CHIEF_TECHNICIAN', 'ADMIN'],
        steps: [
            {
                title: 'Откройте назначенную задачу',
                action: 'Сначала проверьте срок, вид работы, цвет, номера зубов, комментарий и файлы врача.',
                example: 'Коронка циркониевая · A2 · зуб 16 · срок сегодня 18:00',
                check: 'Техническое задание понятно, нужные файлы открываются.',
            },
            {
                title: 'Выполните только свой этап',
                action: 'Не переводите задачу заранее. Статус меняется после фактического окончания операции.',
                example: 'Моделирование завершено → передать на фрезеровку',
                check: 'Результат этапа сохранён и готов к передаче.',
            },
            {
                title: 'Нажмите переход на следующий этап',
                action: 'Выберите следующий статус и сотрудника, если система просит назначение.',
                example: 'Следующий статус: «Фрезеровка» · исполнитель: Садыков М.',
                check: 'Карточка исчезла из текущего этапа и появилась на следующем.',
            },
        ],
    },
    {
        id: 'materials',
        kind: 'materials',
        category: 'Материалы',
        title: 'Заполнить материальный отчёт',
        result: 'Склад увидит реальный расход, потери и возврат, а в учёте не возникнет расхождений.',
        path: 'Задача → Перевести этап → Материальный отчёт',
        href: '/employee',
        duration: '4 минуты',
        roles: ['TECHNICIAN', 'CHIEF_TECHNICIAN', 'ADMIN', 'DISPATCHER'],
        steps: [
            {
                title: 'Запишите выданное количество',
                action: 'В поле «Выдано» укажите, сколько материала реально получили для этой задачи.',
                example: 'Выдано: 10 г',
                check: 'Значение совпадает с фактически полученным материалом, а не только с планом.',
            },
            {
                title: 'Распределите весь материал',
                action: 'Разделите выданное на использованное, потери и возврат.',
                example: '10 = использовано 7 + потери 2 + возврат 1',
                check: 'В колонке «Разница» отображается 0.',
            },
            {
                title: 'Объясните потери',
                action: 'Если есть отход или брак, напишите конкретную причину в примечании.',
                example: '«2 г — скол заготовки при фрезеровке»',
                check: 'По комментарию понятно, что произошло и почему.',
            },
        ],
    },
    {
        id: 'payroll',
        kind: 'payroll',
        category: 'Зарплата',
        title: 'Настроить расчёт и закрыть зарплату',
        result: 'Будет создана проверенная зарплатная ведомость за выбранный период.',
        path: 'Зарплатные планы',
        href: '/accounting/payroll',
        duration: '8 минут',
        roles: ['ADMIN', 'FINANCIER', 'CHIEF_TECHNICIAN'],
        steps: [
            {
                title: 'Проверьте схему оплаты сотрудника',
                action: 'Выберите фиксированную, сдельную или гибридную оплату и задайте ставку. Не меняйте схему посреди закрываемого периода.',
                example: 'Техник: сдельная · коронка циркониевая — 4 000 ₸ за единицу',
                check: 'У каждого сотрудника указан тип оплаты и действующая ставка.',
            },
            {
                title: 'Выберите период без пересечений',
                action: 'Укажите точные начало и конец расчётного периода. Проверьте, что за эти даты ещё нет подтверждённой ведомости.',
                example: '01.07.2026 00:00 — 31.07.2026 23:59',
                check: 'Период не пересекается с ранее закрытой зарплатой.',
            },
            {
                title: 'Сформируйте и откройте расшифровку',
                action: 'Система соберёт завершённые задачи. Откройте список работ каждого сотрудника и проверьте количество и ставки.',
                example: '12 коронок × 4 000 ₸ = 48 000 ₸',
                check: 'В расчёте нет незавершённых, чужих или повторяющихся задач.',
            },
            {
                title: 'Подтвердите только согласованную ведомость',
                action: 'Сверьте итог с руководителем, затем подтвердите. После подтверждения ведомость считается финансовым фактом.',
                example: 'Итого сотруднику: 48 000 ₸ · статус «Подтверждена»',
                check: 'Период, сотрудник и сумма проверены до нажатия кнопки.',
            },
        ],
    },
    {
        id: 'workflow',
        kind: 'workflow',
        category: 'Конфигурация',
        title: 'Настроить маршрут производства',
        result: 'Новые задачи выбранного типа будут проходить этапы в правильном порядке и назначаться нужным ролям.',
        path: 'Лаборатория → Workflow',
        href: '/laboratory/workflows',
        duration: '10 минут',
        roles: ['ADMIN', 'CHIEF_TECHNICIAN'],
        steps: [
            {
                title: 'Нарисуйте процесс до настройки',
                action: 'Согласуйте линейку статусов и ответственных вне CRM. Не начинайте с кнопок.',
                example: 'Новая → Моделирование → Фрезеровка → Контроль → Готово',
                check: 'Для каждого этапа известны вход, выход и ответственная роль.',
            },
            {
                title: 'Создайте переходы по порядку',
                action: 'Для каждого шага задайте исходный статус, следующий статус, порядок и требуемую роль.',
                example: 'Моделирование → Фрезеровка · порядок 2 · роль TECHNICIAN',
                check: 'Нет тупиков, пропущенных или дублирующихся переходов.',
            },
            {
                title: 'Настройте материальный контроль',
                action: 'Отметьте шаги, где отчёт обязателен, и отдельно решите, разрешены ли незапланированные материалы.',
                example: 'Перед «Готово»: материальный отчёт обязателен',
                check: 'Финальный переход нельзя выполнить без полного отчёта.',
            },
            {
                title: 'Пройдите тестовый заказ',
                action: 'Создайте одну тестовую задачу и вручную проведите её через весь маршрут под нужными ролями.',
                example: 'TEST — коронка A2, без реального списания',
                check: 'Все роли видят только свои действия, назначения и отчёты работают.',
            },
        ],
    },
];

function BrowserFrame({ children, title }: { children: ReactNode; title: string }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,.45)]">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate rounded-md bg-white px-3 py-1 text-[9px] font-semibold text-slate-400">{title}</span>
            </div>
            {children}
        </div>
    );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <p className="mb-1 text-[8px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <div className="truncate rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-700">{value}</div>
        </div>
    );
}

function GuidePreview({ kind, step }: { kind: GuideKind; step: number }) {
    if (kind === 'orders') {
        return (
            <BrowserFrame title="Создание заказа">
                <div className="border-b border-slate-100 px-4 py-3"><p className="text-[9px] font-black text-violet-600">НОВЫЙ ЗАКАЗ</p><p className="text-sm font-black text-slate-900">Регистрация наряда</p></div>
                <div className="grid grid-cols-4 gap-1.5 px-4 py-2">{['Заказчик', 'Работы', 'Проверка'].map((item, index) => <div key={item} className={`rounded-lg px-2 py-1.5 text-center text-[8px] font-black ${index === Math.min(step, 2) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}. {item}</div>)}</div>
                <div className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-2">
                    {step === 0 ? <><Field label="Клиника" value="Dental Pro" wide /><Field label="Врач" value="Ахметова А." /><Field label="Срок" value="28.07.2026" /><Field label="Пациент" value="Иванов Иван" wide /></> : step < 3 ? <><Field label="Вид работы" value="Коронка циркониевая" wide /><Field label="Цвет" value="A2" /><Field label="Количество" value="1" /><Field label="Материал" value="Цирконий ✓" wide /></> : <><div className="sm:col-span-2 rounded-xl bg-white p-3"><p className="text-[9px] text-slate-400">Пациент и срок</p><p className="text-xs font-black">Иванов Иван · 28 июля</p></div><div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-slate-900 p-3 text-white"><span className="text-[10px]">2 технические работы</span><b>48 000 ₸</b></div></>}
                </div>
                <div className="flex justify-end border-t border-slate-100 p-3"><span className="rounded-lg bg-violet-600 px-4 py-2 text-[9px] font-black text-white">{step === 3 ? 'Создать заказ' : 'Продолжить'}</span></div>
            </BrowserFrame>
        );
    }

    if (kind === 'materials') {
        return (
            <BrowserFrame title="Материальный отчёт">
                <div className="p-4">
                    <p className="text-xs font-black text-slate-900">Цирконий <span className="font-medium text-slate-400">· грамм</span></p>
                    <div className="mt-3 grid grid-cols-4 gap-2"><Field label="Выдано" value="10" /><Field label="Исп." value={step > 0 ? '7' : '0'} /><Field label="Потери" value={step > 0 ? '2' : '0'} /><Field label="Возврат" value={step > 0 ? '1' : '0'} /></div>
                    <div className={`mt-3 rounded-lg px-3 py-2 text-[10px] font-black ${step > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>Разница: {step > 0 ? '0 — всё сходится' : '10 — распределите материал'}</div>
                    {step > 1 && <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-[9px] text-slate-500">Причина: скол заготовки при фрезеровке</div>}
                </div>
            </BrowserFrame>
        );
    }

    if (kind === 'payroll') {
        return (
            <BrowserFrame title="Зарплатные планы">
                <div className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-2"><Field label="Сотрудник" value="Садыков Марат" wide /><Field label="Тип оплаты" value={step === 0 ? 'Сдельная' : 'Сдельная ✓'} /><Field label="Период" value="01–31 июля" /><div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3"><div className="flex justify-between text-[10px]"><b>Коронка циркониевая</b><span>12 × 4 000 ₸</span></div><div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs font-black"><span>Итого</span><span>48 000 ₸</span></div></div></div>
                <div className="flex justify-end p-3"><span className={`rounded-lg px-4 py-2 text-[9px] font-black text-white ${step >= 3 ? 'bg-emerald-600' : 'bg-violet-600'}`}>{step >= 3 ? 'Подтвердить ведомость' : 'Сформировать расчёт'}</span></div>
            </BrowserFrame>
        );
    }

    if (kind === 'workflow') {
        return (
            <BrowserFrame title="Workflow · Коронка">
                <div className="space-y-2 bg-slate-50 p-4">{['Новая', 'Моделирование', 'Фрезеровка', 'Контроль', 'Готово'].map((status, index) => <div key={status} className={`flex items-center gap-3 rounded-xl border p-2.5 ${index === Math.min(step + 1, 4) ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[8px] font-black text-white">{index + 1}</span><span className="flex-1 text-[10px] font-black text-slate-700">{status}</span>{index < 4 && <span className="text-[8px] text-slate-400">TECHNICIAN →</span>}</div>)}</div>
            </BrowserFrame>
        );
    }

    return (
        <BrowserFrame title="Рабочая зона">
            <div className="p-4"><div className="rounded-xl border border-violet-200 bg-violet-50 p-3"><p className="text-[9px] font-black text-violet-600">ЗАДАЧА #1248</p><p className="mt-1 text-sm font-black text-slate-900">Коронка циркониевая · зуб 16</p><p className="mt-1 text-[10px] text-slate-500">A2 · срок сегодня, 18:00</p></div><div className="my-3 flex items-center justify-center gap-2 text-[9px] font-bold"><span className="rounded-lg bg-slate-100 px-2 py-1.5">Моделирование</span><span>→</span><span className="rounded-lg bg-violet-600 px-2 py-1.5 text-white">Фрезеровка</span></div><div className="flex justify-end"><span className="rounded-lg bg-violet-600 px-4 py-2 text-[9px] font-black text-white">Передать дальше</span></div></div>
        </BrowserFrame>
    );
}

export default function KnowledgeBasePage() {
    const { role, roles } = useSelector((state: RootState) => state.auth);
    const normalizedRoles = useMemo(
        () => {
            const result = new Set([role, ...roles].filter(Boolean).map((item) => String(item).replace(/^ROLE_/u, '').toUpperCase()));
            if (result.has('HEAD_TECHNICIAN')) result.add('CHIEF_TECHNICIAN');
            return result;
        },
        [role, roles],
    );

    const visibleGuides = useMemo(
        () => guides.filter((guide) => guide.roles.some((allowedRole) => normalizedRoles.has(allowedRole))),
        [normalizedRoles],
    );
    const [search, setSearch] = useState('');
    const [activeGuideId, setActiveGuideId] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const activeGuide = visibleGuides.find((guide) => guide.id === activeGuideId) ?? visibleGuides[0];
    const filteredGuides = visibleGuides.filter((guide) => `${guide.title} ${guide.result} ${guide.category}`.toLocaleLowerCase('ru-RU').includes(search.trim().toLocaleLowerCase('ru-RU')));
    const displayRole = roleNames[String(role)] ?? 'Сотрудник';

    const selectGuide = (id: string) => {
        setActiveGuideId(id);
        setActiveStep(0);
    };

    if (!activeGuide) return null;

    return (
        <div className="mx-auto max-w-7xl pb-10">
            <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Учебный центр · {displayRole}</p><h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Как работать в TeethTech</h1><p className="mt-1 text-xs leading-5 text-slate-500">Здесь показаны только процессы, доступные вашей роли.</p></div>
                <label className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:max-w-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-slate-400"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path d="m16 16 4 4" strokeWidth="2"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs font-semibold outline-none" placeholder="Найти инструкцию…" /></label>
            </header>

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-4 lg:self-start">
                    <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Доступные инструкции</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible">
                        {filteredGuides.map((guide, index) => (
                            <button key={guide.id} type="button" onClick={() => selectGuide(guide.id)} className={`min-w-[230px] rounded-2xl border p-3 text-left transition lg:w-full ${activeGuide.id === guide.id ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200'}`}>
                                <span className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${activeGuide.id === guide.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span><span className="min-w-0"><span className="block text-[9px] font-black uppercase text-violet-600">{guide.category}</span><span className="mt-0.5 block text-xs font-black leading-4 text-slate-800">{guide.title}</span></span></span>
                            </button>
                        ))}
                        {filteredGuides.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">Инструкции не найдены.</p>}
                    </div>
                    <div className="mt-3 hidden rounded-2xl bg-slate-900 p-4 text-white lg:block"><p className="text-[9px] font-black uppercase text-slate-400">Нет лишнего</p><p className="mt-1 text-xs leading-5 text-slate-300">Административные настройки и финансы видят только сотрудники с соответствующей ролью.</p></div>
                </aside>

                <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-7">
                        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[9px] font-black uppercase text-violet-700">{activeGuide.category}</span><span className="text-[10px] font-bold text-slate-400">{activeGuide.duration}</span></div>
                        <h2 className="mt-3 text-2xl font-black text-slate-950">{activeGuide.title}</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[9px] font-black uppercase text-emerald-700">Что получится</p><p className="mt-1 text-xs leading-5 text-emerald-900">{activeGuide.result}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Где открыть</p><p className="mt-1 text-xs font-black text-slate-800">{activeGuide.path}</p></div></div>
                    </div>

                    <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,.85fr)_minmax(380px,1.15fr)]">
                        <section>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Нажимайте на шаги</p>
                            <ol className="space-y-2">
                                {activeGuide.steps.map((step, index) => (
                                    <li key={step.title}>
                                        <button type="button" onClick={() => setActiveStep(index)} className={`w-full rounded-2xl border p-4 text-left transition ${activeStep === index ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-200'}`}>
                                            <span className="flex gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${activeStep === index ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span><span><span className="block text-sm font-black text-slate-900">{step.title}</span>{activeStep === index && <span className="mt-2 block text-xs leading-5 text-slate-600">{step.action}</span>}</span></span>
                                            {activeStep === index && <span className="mt-3 block space-y-2 pl-10"><span className="block rounded-lg bg-white px-3 py-2 text-[10px] text-slate-600"><b className="text-violet-700">Пример:</b> {step.example}</span><span className="block text-[10px] font-bold text-emerald-700">✓ Проверка: {step.check}</span></span>}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className="xl:sticky xl:top-4 xl:self-start">
                            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Пример окна</p><p className="text-[10px] font-bold text-violet-600">Шаг {activeStep + 1} из {activeGuide.steps.length}</p></div>
                            <GuidePreview kind={activeGuide.kind} step={activeStep} />
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between"><button type="button" disabled={activeStep === 0} onClick={() => setActiveStep((step) => Math.max(0, step - 1))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-30">← Предыдущий шаг</button>{activeStep < activeGuide.steps.length - 1 ? <button type="button" onClick={() => setActiveStep((step) => step + 1)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">Следующий шаг →</button> : <Link href={activeGuide.href} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-xs font-black text-white">Открыть раздел CRM →</Link>}</div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
