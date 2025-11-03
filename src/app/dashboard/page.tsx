'use client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Package, Truck, Wallet, PackageSearch } from "lucide-react"

import { getInventory } from "@/lib/actions"
import type { InventoryItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { useEffect, useState, useCallback } from "react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await getInventory()
    setInventory(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData();
    
    const handleDataChange = () => fetchData();
    window.addEventListener('datachange', handleDataChange);
    return () => {
      window.removeEventListener('datachange', handleDataChange);
    }
  }, [fetchData]);


  const totalSKUs = inventory.length
  const lowStockItems = inventory.filter((item) => item.stock <= item.reorderLevel)
  const totalValue = inventory.reduce((acc, item) => acc + item.stock * item.price, 0)
  const mostStockedItem = inventory.reduce(
    (max, item) => (item.stock > max.stock ? item : max),
    inventory[0] || { name: "N/A", stock: 0 }
  )

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
            <p className="text-xs text-muted-foreground">
              unique products in inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items Low on Stock
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              need to be reordered soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              across all products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Stocked Item</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{mostStockedItem.name}</div>
            <p className="text-xs text-muted-foreground">
              with {mostStockedItem.stock} units
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardClient inventory={inventory} lowStockItems={lowStockItems} />
    </div>
  )
}
