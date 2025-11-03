"use client";

import { useSearchParams } from 'next/navigation'
import type { InventoryItem } from "@/lib/types"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import { useState, useCallback, useEffect } from 'react';

type InventoryClientProps = {
    initialData: InventoryItem[];
    onDataChange: () => void;
}

export function InventoryClient({ initialData, onDataChange }: InventoryClientProps) {
    const [inventory, setInventory] = useState<InventoryItem[]>(initialData);
    const searchParams = useSearchParams()

    useEffect(() => {
        setInventory(initialData);
    }, [initialData]);

    const findItemByName = (name: string) => {
        return inventory.find(item => item.name.toLowerCase() === name.toLowerCase());
    }

    const newItemData: Partial<InventoryItem> = {};
    if (searchParams.has('itemName')) newItemData.name = searchParams.get('itemName')!;
    if (searchParams.has('quantity')) newItemData.stock = Number(searchParams.get('quantity'));
    if (searchParams.has('price')) newItemData.price = Number(searchParams.get('price'));
    if (searchParams.has('reorderLevel')) newItemData.reorderLevel = Number(searchParams.get('reorderLevel'));

    return (
        <div className="container mx-auto py-10">
            <InventoryTable 
                data={inventory} 
                onItemAdded={onDataChange}
                onItemUpdated={onDataChange}
                onItemDeleted={onDataChange}
                // Props for dialogs triggered by URL
                openAddDialog={searchParams.get('openAddDialog') === 'true'}
                newItemData={newItemData}
                itemToEdit={findItemByName(searchParams.get('editItem') || '')}
                itemToView={findItemByName(searchParams.get('viewItem') || '')}
                itemToDelete={findItemByName(searchParams.get('deleteItem') || '')}
            />
        </div>
    )
}
