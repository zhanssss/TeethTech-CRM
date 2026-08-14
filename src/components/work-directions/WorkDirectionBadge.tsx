import { getWorkDirectionBadgeClass } from '@/src/utils/workDirections';

type WorkDirectionBadgeProps = {
    code: string;
    name: string;
    className?: string;
};

export default function WorkDirectionBadge({
    code,
    name,
    className = '',
}: WorkDirectionBadgeProps) {
    return (
        <span
            title={code}
            className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${getWorkDirectionBadgeClass(code)} ${className}`}
        >
            <span className="truncate">{name || code}</span>
        </span>
    );
}
