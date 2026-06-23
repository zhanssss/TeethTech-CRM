export type Login = {
    email: string;
    password: string;
}

export type LoginResponse = {
    id: string;
    email: string;
    token?: string;
    roles: string[];
}

export type SalaryType = 'FIXED' | 'PER_UNIT';

export type Register = {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    salaryType: SalaryType;
    salary: number;
}
