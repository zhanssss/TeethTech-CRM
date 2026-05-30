export type Material = {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
};

export type CreateMaterialDto = {
    name: string;
    description: string;
};

export type UpdateMaterialDto = {
    name: string;
    description: string;
};

export type UpdateMaterialArgs = {
    id: string;
    body: UpdateMaterialDto;
};