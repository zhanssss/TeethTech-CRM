'use client';

import { useState } from 'react';

import InventoryPanel from '@/src/components/warehouse/InventoryPanel';
import NomenclaturePanel from '@/src/components/warehouse/NomenclaturePanel';
import ProcurementPanel from '@/src/components/warehouse/ProcurementPanel';
import WarehouseOverview from '@/src/components/warehouse/WarehouseOverview';

type WarehouseTab = 'overview' | 'procurement' | 'nomenclature' | 'inventory';

const tabs: Array<{ id: WarehouseTab; label: string; description: string }> = [
    { id: 'overview', label: 'Обзор', description: 'Остатки и движения' },
    { id: 'procurement', label: 'Закупки', description: 'Заказы и поставщики' },
    { id: 'nomenclature', label: 'Номенклатура', description: 'Позиции и приход' },
    { id: 'inventory', label: 'Инвентаризации', description: 'Пересчёт склада' },
];

export default function WarehousePage() {
    const [activeTab, setActiveTab] = useState<WarehouseTab>('overview');

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7.5 12 3l8 4.5M4 7.5v9L12 21m-8-13.5 8 4.5m8-4.5v9L12 21m8-13.5L12 12m0 9v-9" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Склад</h1>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Закупки, остатки, движения и инвентаризации
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500 shadow-sm">
                    Остатки обновляются после каждого движения склада
                </div>
            </header>

            <nav
                aria-label="Разделы склада"
                className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2 xl:grid-cols-4"
            >
                {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-xl px-4 py-3 text-left transition ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className="block text-sm font-black">{tab.label}</span>
                            <span className={`mt-0.5 block text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                                {tab.description}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {activeTab === 'overview' && (
                <WarehouseOverview
                    onOpenNomenclature={() => setActiveTab('nomenclature')}
                    onOpenInventory={() => setActiveTab('inventory')}
                />
            )}
            {activeTab === 'procurement' && <ProcurementPanel />}
            {activeTab === 'nomenclature' && <NomenclaturePanel />}
            {activeTab === 'inventory' && <InventoryPanel />}
        </div>
    );
}
