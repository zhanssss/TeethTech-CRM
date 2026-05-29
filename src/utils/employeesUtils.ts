export function getKpiColor(rate: number) {
    if (rate >= 95) return 'bg-green-100 text-green-700';
    if (rate >= 85) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}

export function getStatusLabel(status: string) {
    switch (status) {
        case 'ACTIVE':
            return 'Активен';
        case 'BUSY':
            return 'Занят';
        case 'FIRED':
            return 'Уволен';
        default:
            return status;
    }
}

export function getStatusBadge(status: string) {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'BUSY':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'FIRED':
            return 'bg-red-50 text-red-700 border-red-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}