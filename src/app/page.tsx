export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Панель управления</h1>
                <p className="text-slate-500">Добро пожаловать, администратор TeethTech</p>
            </header>

            {/* Карточки со статистикой */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Всего заказов</p>
                    <p className="text-3xl font-bold mt-1">124</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-400">
                    <p className="text-sm font-medium text-slate-500">В работе</p>
                    <p className="text-3xl font-bold mt-1">18</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                    <p className="text-sm font-medium text-slate-500">Готовы к выдаче</p>
                    <p className="text-3xl font-bold mt-1">7</p>
                </div>
            </div>

            {/* Заглушка под график или таблицу */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex items-center justify-center">
                <p className="text-slate-400">Здесь будет график загрузки лаборатории</p>
            </div>
        </div>
    );
}