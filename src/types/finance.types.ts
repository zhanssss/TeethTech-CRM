export type FinanceReportRequest = {
    startDate: string;
    endDate: string;
};

export type FinanceReport = {
    startDate: string;
    endDate: string;
    totalCompletedTasks: number;
    grossRevenue: number;
    totalDiscounts: number;
    netRevenue: number;
    totalPayroll: number;
    grossProfit: number;
    marginPercentage: number;
};

export type SalaryPaymentType = 'FIXED' | 'PIECEWORK' | 'HYBRID';

export type SalaryConfig = {
    userId: string;
    paymentType: SalaryPaymentType;
    baseSalary: number;
    commissionPercent: number;
};

export type UpsertSalaryConfigRequest = SalaryConfig;

export type SalaryStatementStatus = 'DRAFT' | 'PAID';

export type SalaryStatementRequest = {
    employeeId: string;
    startDate: string;
    endDate: string;
    comment?: string;
};

export type SalaryStatementTask = {
    taskId: string;
    orderNumber: string;
    workTypeName: string;
    quantity: number;
    taskAmount: number;
    earnedAmount: number;
    completedAt: string;
};

export type SalaryStatement = {
    statementId: string;
    employeeId: string;
    employeeName: string;
    paymentType: SalaryPaymentType;
    status: SalaryStatementStatus;
    startDate: string;
    endDate: string;
    baseSalaryAmount: number;
    pieceworkAmount: number;
    totalAmount: number;
    totalTaskCount: number;
    tasks: SalaryStatementTask[];
};

export type SalaryEmployee = {
    id: string;
    name: string;
    email: string;
};

export type SalaryStatementsHistoryRequest = {
    start: string;
    end: string;
};
