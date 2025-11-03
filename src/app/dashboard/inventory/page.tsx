'use client'

import { useState } from "react"
import { getInventory } from "@/lib/actions"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import type { InventoryItem, VoiceCommandResponse } from "@/lib/types"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'


export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const searchParams = useSearchParams()
    const openAddDialog = searchParams.get('openAddDialog') === 'true';
    const newItemName = searchParams.get('itemName') || undefined;

    useState(() => {
        const fetchInventory = async () => {
            setLoading(true);
            const data = await getInventory();
            setInventory(data);
            setLoading(false);
        };
        fetchInventory();
    });

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto py-10">
            <InventoryTable 
                data={inventory} 
                openAddDialog={openAddDialog} 
                newItemName={newItemName}
            />
        </div>
    )
}
