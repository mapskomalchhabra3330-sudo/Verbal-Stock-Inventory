'use client'

import { useEffect, useState, useCallback } from "react"
import { getInventory } from "@/lib/actions"
import type { InventoryItem } from "@/lib/types"
import { InventoryClient } from "@/components/dashboard/inventory-client"


export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const data = await getInventory();
        setInventory(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventory();

        const handleDataChange = () => fetchInventory();
        window.addEventListener('datachange', handleDataChange);
        return () => {
            window.removeEventListener('datachange', handleDataChange);
        };
    }, [fetchInventory]);

    if (loading) {
        return <div className="container mx-auto py-10">Loading...</div>
    }

    return (
        <InventoryClient 
            initialData={inventory} 
            onDataChange={fetchInventory}
        />
    )
}
