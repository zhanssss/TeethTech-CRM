export type Clinic = {
    id: string;
    displayId: number;
    name: string;
    address: string;
    phone: string;
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
}


export type CreateClinicDto = {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    bin: string;
}

export type UpdateClinicDto =
    Partial<CreateClinicDto>;

export type ClinicDetailedInfo = {
    id: string,
    totalOrdersCount: number,
    totalAmount: number,
    totalPaid: number,
    totalDebt: number,
    name: string,
    phone: string,
    address: string,
    contactPerson: string,
    email: string,
    priceType: string,
    discountPercent: number,
    doctors:
        {
            fullName: string
        }[],
    orders:
        {
            id: string,
            patientName: string,
            summaryWork: string,
            status: string,
            totalAmount: number,
            paidAmount: number
        }[],
}

