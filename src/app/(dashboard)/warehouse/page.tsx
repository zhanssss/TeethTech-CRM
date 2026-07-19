'use client'

import { useState } from 'react'

import InventoryPanel from '@/src/components/warehouse/InventoryPanel'
import NomenclaturePanel from '@/src/components/warehouse/NomenclaturePanel'
import ProcurementPanel from '@/src/components/warehouse/ProcurementPanel'
import WarehouseOverview from '@/src/components/warehouse/WarehouseOverview'

type WarehouseTab = 'overview' | 'procurement' | 'nomenclature' | 'inventory'

const tabs: Array<{ id: WarehouseTab; label: string }> = [
	{ id: 'overview', label: 'Обзор' },
	{ id: 'procurement', label: 'Закупки' },
	{ id: 'nomenclature', label: 'Номенклатура' },
	{ id: 'inventory', label: 'Инвентаризация' }
]

export default function WarehousePage() {
	const [activeTab, setActiveTab] = useState<WarehouseTab>('overview')

	return (
		<div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
			<header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-100">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								className="h-6 w-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.8"
									d="M4 7.5 12 3l8 4.5M4 7.5v9L12 21m-8-13.5 8 4.5m8-4.5v9L12 21m8-13.5L12 12m0 9v-9"
								/>
							</svg>
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight text-slate-900">Склад</h1>
							<p className="mt-0.5 text-sm text-slate-500">
								Закупки, остатки, движения и инвентаризации
							</p>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500 shadow-sm">
					Остатки обновляются после каждого движения склада
				</div>
			</header>

			<nav
				aria-label="Разделы склада"
				className="flex gap-1 overflow-x-auto border-b border-slate-200"
			>
				{tabs.map(tab => {
					const active = activeTab === tab.id
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
						>
							{tab.label}
							{active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />}
						</button>
					)
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
	)
}
