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

export type SalaryCapMode = 'TOTAL' | 'VARIABLE_ONLY';
export type SalaryRuleTreatment =
    | 'INCLUDED_IN_BASE'
    | 'PAID_EXTRA'
    | 'NOT_PAYABLE'
    | 'REQUIRES_REVIEW';
export type SalaryCalculationType =
    | 'ONCE_PER_STAGE'
    | 'TASK_QUANTITY'
    | 'TEETH_COUNT'
    | 'PERCENT_OF_TASK';

export type SalaryPlanRule = {
    id: string;
    name: string;
    workTypeId: string | null;
    workTypeName?: string | null;
    statusId: string | null;
    statusName?: string | null;
    treatment: SalaryRuleTreatment;
    calculationType: SalaryCalculationType;
    rate: number;
    priority: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    active: boolean;
};

export type SalaryPlan = {
    id: string;
    userId: string;
    name: string;
    baseSalary: number;
    monthlyCap: number | null;
    capMode: SalaryCapMode;
    carryForward: boolean;
    effectiveFrom: string;
    effectiveTo: string | null;
    active: boolean;
    rules?: SalaryPlanRule[];
};

export type UpsertSalaryPlanRequest = Omit<SalaryPlan, 'id' | 'rules'>;
export type UpsertSalaryRuleRequest = Omit<
    SalaryPlanRule,
    'id' | 'workTypeName' | 'statusName'
>;

export type SalaryPreviewRequest = {
    employeeId: string;
    start: string;
    end: string;
};

export type SalaryAccrual = {
    id?: string;
    taskId?: string;
    orderNumber?: string;
    ruleId?: string;
    ruleName?: string;
    statusId?: string | null;
    statusName?: string | null;
    workTypeId?: string | null;
    workTypeName?: string | null;
    treatment: SalaryRuleTreatment;
    calculationType?: SalaryCalculationType;
    quantity?: number | null;
    rate?: number | null;
    amount: number;
    completedAt?: string | null;
    comment?: string | null;
};

export type SalaryCalculationPreview = {
    employeeId: string;
    start: string;
    end: string;
    baseSalary: number;
    extraAccrued: number;
    grossAccrued: number;
    carryIn: number;
    available: number;
    monthlyCap: number | null;
    payable: number;
    carryOut: number;
    accruals: SalaryAccrual[];
};

export type CreateFlexibleSalaryStatementRequest = {
    employeeId: string;
    start: string;
    end: string;
    comment: string | null;
};

export type FlexibleSalaryStatementResult = {
    statementId: string;
    status: string;
};
