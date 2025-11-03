'use client'

import { useEffect, useState } from "react"
import { getInventory } from "@/lib/actions"
import type { InventoryItem } from "@/lib/types"
import { InventoryClient } from "@/components/dashboard/inventory-client"


export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchInventory = async () => {
            setLoading(true);
            const data = await getInventory();
            setInventory(data);
            setLoading(false);
        };
        fetchInventory();
    }, []);

    if (loading) {
        return <div className="container mx-auto py-10">Loading...</div>
    }

    const handleItemAdded = (newItem: InventoryItem) => {
        setInventory(prevInventory => [newItem, ...prevInventory]);
    };

    return (
        <InventoryClient initialData={inventory} onItemAdded={handleItemAdded} />
    )
}
