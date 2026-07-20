'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
	const router = useRouter()
	const searchParams = useSearchParams()
	const requestedTab = searchParams.get('tab') as WarehouseTab | null
	const initialTab = requestedTab && tabs.some(tab => tab.id === requestedTab) ? requestedTab : 'overview'
	const [localTab, setLocalTab] = useState<WarehouseTab>(initialTab)
	const activeTab = requestedTab && tabs.some(tab => tab.id === requestedTab) ? requestedTab : localTab
	const selectTab = (tab: WarehouseTab) => {
		setLocalTab(tab)
		router.replace(`/warehouse?tab=${tab}`, { scroll: false })
	}

	return (
		<div className="mx-auto w-full max-w-[1600px] pb-8">
			{activeTab === 'overview' && (
				<WarehouseOverview
					onOpenNomenclature={() => selectTab('nomenclature')}
					onOpenInventory={() => selectTab('inventory')}
				/>
			)}
			{activeTab === 'procurement' && <ProcurementPanel />}
			{activeTab === 'nomenclature' && <NomenclaturePanel />}
			{activeTab === 'inventory' && <InventoryPanel />}
		</div>
	)
}
