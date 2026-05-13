type StatCardProps = {
    title: string;
    value: string | number;
    trend?: string;
    isPositive?: boolean;
};

export const StatCard = ({title, value, trend, isPositive}: StatCardProps) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {trend ?
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {trend}
                </span> :
                <></>
            }
        </div>
    </div>
);
