'use client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Package, Truck, Wallet, PackageSearch } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useEffect, useMemo, useCallback } from "react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import type { InventoryItem } from "@/lib/types"
import { collection, query } from "firebase/firestore"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"

export default function DashboardPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

   useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const inventoryQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'inventoryItems'))
  }, [firestore, user]);

  const { data: inventory = [], isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryQuery);

  const loading = isUserLoading || isInventoryLoading;

  if (loading) {
    return <div className="container mx-auto py-10">Loading Dashboard...</div>
  }
  
  if (!user) {
    return <div className="container mx-auto py-10">Please sign in to view your dashboard.</div>
  }

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
