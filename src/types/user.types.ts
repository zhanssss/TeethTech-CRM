export type User = {
    id: string,
    fullName: string,
    specialization: string,
    role: string,
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

