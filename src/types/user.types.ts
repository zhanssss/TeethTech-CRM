export type User = {
    id: string,
    fullName: string,
    specialization?: string | null,
    role?: string | null,
    roles?: string[],
    salaryType?: 'FIXED' | 'PER_UNIT',
    salary?: number,
    unitsCompleted?: number,
    status: string,
    stats: {
        completed: number,
        inProgress: number,
        overdue: number,
        totalTasks: number,
        avgDays: number,
        timelyPercent: number
    }
}

