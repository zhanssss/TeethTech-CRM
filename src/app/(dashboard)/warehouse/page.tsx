type StockStatus = 'ok' | 'warning' | 'critical';

type StockItem = {
    name: string;
    category: string;
    balance: string;
    reserved: string;
    minimum: string;
    status: StockStatus;
};

type Movement = {
    id: string;
    title: string;
    date: string;
    amount: string;
    type: 'income' | 'outcome';
};

const warehouseStats = [
    {
        title: 'Материалов в наличии',
        value: '148',
        description: '34 позиции требуют контроля партий',
        accent: 'border-l-blue-500',
    },
    {
        title: 'Низкий остаток',
        value: '12',
        description: 'Нужно заказать до конца недели',
        accent: 'border-l-amber-500',
    },
    {
        title: 'Зарезервировано',
        value: '38',
        description: 'Под активные заказы лаборатории',
        accent: 'border-l-purple-500',
    },
    {
        title: 'Стоимость остатков',
        value: '7 840 000 ₸',
        description: 'Оценка по закупочным ценам',
        accent: 'border-l-emerald-500',
    },
];

const stockItems: StockItem[] = [
    {
        name: 'Zirconia HT A2',
        category: 'Диски',
        balance: '18 шт.',
        reserved: '5 шт.',
        minimum: '10 шт.',
        status: 'ok',
    },
    {
        name: 'E-max Press LT',
        category: 'Керамика',
        balance: '7 уп.',
        reserved: '3 уп.',
        minimum: '8 уп.',
        status: 'warning',
    },
    {
        name: 'PMMA Temporary',
        category: 'Временные материалы',
        balance: '4 шт.',
        reserved: '2 шт.',
        minimum: '6 шт.',
        status: 'critical',
    },
    {
        name: 'Titanium Blank',
        category: 'Металл',
        balance: '22 шт.',
        reserved: '4 шт.',
        minimum: '12 шт.',
        status: 'ok',
    },
    {
        name: 'Model Resin Beige',
        category: 'Печать',
        balance: '9 л',
        reserved: '1 л',
        minimum: '8 л',
        status: 'ok',
    },
];

const movements: Movement[] = [
    {
        id: 'WH-1048',
        title: 'Приход Zirconia HT A2',
        date: '12.06.2026',
        amount: '+12 шт.',
        type: 'income',
    },
    {
        id: 'WH-1047',
        title: 'Списание E-max под заказ #TT-2606-017',
        date: '11.06.2026',
        amount: '-2 уп.',
        type: 'outcome',
    },
    {
        id: 'WH-1046',
        title: 'Резерв PMMA Temporary',
        date: '10.06.2026',
        amount: '-1 шт.',
        type: 'outcome',
    },
    {
        id: 'WH-1045',
        title: 'Приход Model Resin Beige',
        date: '09.06.2026',
        amount: '+5 л',
        type: 'income',
    },
];

const purchasePlan = [
    {
        material: 'E-max Press LT',
        supplier: 'Ivoclar Kazakhstan',
        amount: '10 уп.',
        budget: '620 000 ₸',
        priority: 'Высокий',
    },
    {
        material: 'PMMA Temporary',
        supplier: 'Dental Market',
        amount: '8 шт.',
        budget: '280 000 ₸',
        priority: 'Высокий',
    },
    {
        material: 'Implant Analog Set',
        supplier: 'Ortho Supply',
        amount: '6 наборов',
        budget: '410 000 ₸',
        priority: 'Средний',
    },
];

const statusLabels: Record<StockStatus, string> = {
    ok: 'Достаточно',
    warning: 'На грани',
    critical: 'Критично',
};

const statusClasses: Record<StockStatus, string> = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    critical: 'bg-red-50 text-red-700 border-red-100',
};

export default function WarehousePage() {
    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Склад
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Остатки материалов, движения и план закупок лаборатории
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Последняя инвентаризация:{' '}
                    <span className="font-bold text-slate-900">10.06.2026</span>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {warehouseStats.map((stat) => (
                    <article
                        key={stat.title}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${stat.accent}`}
                    >
                        <p className="text-sm font-medium text-slate-500">
                            {stat.title}
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {stat.value}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                            {stat.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                Остатки по материалам
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Статичные значения для проектного макета склада
                            </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            5 ключевых позиций
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">Материал</th>
                                <th className="p-4 font-bold">Категория</th>
                                <th className="p-4 font-bold">Остаток</th>
                                <th className="p-4 font-bold">Резерв</th>
                                <th className="p-4 font-bold">Минимум</th>
                                <th className="p-4 text-right font-bold">Статус</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {stockItems.map((item) => (
                                <tr
                                    key={item.name}
                                    className="transition hover:bg-blue-50/30"
                                >
                                    <td className="p-4 text-sm font-bold text-slate-900">
                                        {item.name}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {item.category}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {item.balance}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {item.reserved}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {item.minimum}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[item.status]}`}
                                        >
                                            {statusLabels[item.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                Движение склада
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Последние приходные и расходные операции
                            </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Сегодня
                        </span>
                    </div>

                    <div className="mt-5 space-y-3">
                        {movements.map((movement) => (
                            <article
                                key={movement.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-xs font-bold text-slate-400">
                                            #{movement.id}
                                        </p>
                                        <h3 className="mt-1 text-sm font-bold text-slate-900">
                                            {movement.title}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {movement.date}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                                            movement.type === 'income'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {movement.amount}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                        План закупок
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Предварительный список материалов для пополнения
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
                    {purchasePlan.map((item) => (
                        <article
                            key={item.material}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        {item.material}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.supplier}
                                    </p>
                                </div>

                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {item.priority}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-bold uppercase text-slate-400">
                                        Количество
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                        {item.amount}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-bold uppercase text-slate-400">
                                        Бюджет
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                        {item.budget}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
