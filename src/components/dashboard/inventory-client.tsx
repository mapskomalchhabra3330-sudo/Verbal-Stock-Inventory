"use client";

import { useSearchParams } from 'next/navigation'
import type { InventoryItem } from "@/lib/types"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import { useState } from 'react';

type InventoryClientProps = {
    initialData: InventoryItem[];
    onItemAdded: (item: InventoryItem) => void;
}

export function InventoryClient({ initialData, onItemAdded }: InventoryClientProps) {
    const [inventory, setInventory] = useState<InventoryItem[]>(initialData);
    const searchParams = useSearchParams()
    const openAddDialog = searchParams.get('openAddDialog') === 'true';
    const newItemName = searchParams.get('itemName') || undefined;

    const handleItemAdded = (newItem: InventoryItem) => {
        setInventory(prev => [newItem, ...prev]);
        onItemAdded(newItem);
    }
    
    return (
        <div className="container mx-auto py-10">
            <InventoryTable 
                data={inventory} 
                openAddDialog={openAddDialog} 
                newItemName={newItemName}
                onItemAdded={handleItemAdded}
            />
        </div>
    )
}
