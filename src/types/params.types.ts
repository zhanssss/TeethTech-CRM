export type GetClinicsParams = {
    page: number;
    size: number;
    sort?: string;
};

export type GetOrdersParams = {
    page: number;
    size: number;
    sort?: string;
};

export type GetClinicRelatedParams = {
    id: string;
    page: number;
    size: number;
    sort?: string;
};
