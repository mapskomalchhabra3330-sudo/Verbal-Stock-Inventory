"use client";

import { useSearchParams } from 'next/navigation'
import type { InventoryItem } from "@/lib/types"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import { useState, useCallback } from 'react';

type InventoryClientProps = {
    initialData: InventoryItem[];
}

export function InventoryClient({ initialData }: InventoryClientProps) {
    const [inventory, setInventory] = useState<InventoryItem[]>(initialData);
    const searchParams = useSearchParams()
    const openAddDialog = searchParams.get('openAddDialog') === 'true';
    
    const newItemData: Partial<InventoryItem> = {};
    if (searchParams.has('itemName')) newItemData.name = searchParams.get('itemName')!;
    if (searchParams.has('quantity')) newItemData.stock = Number(searchParams.get('quantity'));
    if (searchParams.has('price')) newItemData.price = Number(searchParams.get('price'));
    if (searchParams.has('reorderLevel')) newItemData.reorderLevel = Number(searchParams.get('reorderLevel'));

    const handleItemAdded = useCallback((newItem: InventoryItem) => {
        setInventory(prev => [newItem, ...prev]);
    }, []);

    const handleItemUpdated = useCallback((updatedItem: InventoryItem) => {
        setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }, []);

    const handleItemDeleted = useCallback((deletedItemId: string) => {
        setInventory(prev => prev.filter(item => item.id !== deletedItemId));
    }, []);

    return (
        <div className="container mx-auto py-10">
            <InventoryTable 
                data={inventory} 
                openAddDialog={openAddDialog} 
                newItemData={newItemData}
                onItemAdded={handleItemAdded}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
            />
        </div>
    )
}
