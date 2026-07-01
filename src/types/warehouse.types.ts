export type NomenclatureItem = {
    id: string;
    code: string;
    name: string;
    unit: string;
    minStockLevel: number;
    active: boolean;
    currentStock: number;
};

export type StockLevelStatus = 'SUFFICIENT' | 'LOW' | 'CRITICAL';

export type StockOverviewItem = {
    nomenclatureId: string;
    name: string;
    unit: string;
    currentQuantity: number;
    minStockLevel: number;
    status: StockLevelStatus;
};

export type StockOverview = {
    totalPositionsCount: number;
    lowStockCount: number;
    items: StockOverviewItem[];
};

export type StockMovementType =
    | 'IN'
    | 'OUT'
    | 'ORDER_CONSUMPTION'
    | 'ORDER_RETURN'
    | 'INVENTORY_ADJUSTMENT';

export type StockMovement = {
    id: string;
    nomenclatureName: string;
    movementType: StockMovementType;
    quantity: number;
    reason: string;
    createdAt: string;
};

export type ReceiveStockRequest = {
    quantity: number;
    reason: string;
};

export type InventoryCheckStatus =
    | 'DRAFT'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export type InventoryCheckItem = {
    id: string;
    nomenclatureId: string;
    nomenclatureName: string;
    unit: string;
    expectedQuantity: number;
    actualQuantity: number | null;
    discrepancy: number;
};

export type InventoryCheck = {
    id: string;
    status: InventoryCheckStatus;
    startedAt: string;
    completedAt: string | null;
    createdByUserId: string;
    comment: string;
    items: InventoryCheckItem[];
};

export type CreateInventoryCheckRequest = {
    comment: string;
};

export type UpdateInventoryItemRequest = {
    actualQuantity: number;
};
