export interface ClinicDoctor {
    id: string;
    name: string;
    phone: string;
    specialization: string;
}

export interface ClinicOrder {
    id: string;
    patient: string;
    workType: string;
    status: string;
    total: number;
    paid: number;
}

export interface ClinicFormData {
    name: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    comment: string;
}

export interface ClinicListItem extends ClinicFormData {
    id: number;
    ordersCount: number;
    activeOrders: number;
    completedOrders: number;
}

export interface ClinicDetails extends ClinicFormData {
    id: string;
    discount: number;
    priceType: string;
    doctors: ClinicDoctor[];
    orders: ClinicOrder[];
}
