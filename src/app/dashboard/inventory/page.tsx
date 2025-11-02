import { getInventory } from "@/lib/actions"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import type { InventoryItem } from "@/lib/types"

export default async function InventoryPage() {
    const data: InventoryItem[] = await getInventory();

    return (
        <div className="container mx-auto py-10">
            <InventoryTable data={data} />
        </div>
    )
}
