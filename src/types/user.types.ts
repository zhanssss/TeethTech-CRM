export type User = {
    id: string,
    fullName: string,
    specialization?: string | null,
    role?: string | null,
    roles?: string[],
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

