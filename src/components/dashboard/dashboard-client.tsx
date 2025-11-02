"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"

import type { InventoryItem } from "@/lib/types"

type DashboardClientProps = {
  inventory: InventoryItem[];
  lowStockItems: InventoryItem[];
};

export function DashboardClient({ inventory, lowStockItems }: DashboardClientProps) {
  const chartData = inventory
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(item => ({...item, fill: 'var(--color-inventory)'}))

  const chartConfig = {
    inventory: {
      label: "Stock",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  return (
    <>
      <div className="grid gap-4 xl:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Top 5 Stocked Items</CardTitle>
            <CardDescription>
              A quick look at your most available products.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 10) + '...'}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="stock" name="Stock" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Reorder Watchlist</CardTitle>
          <CardDescription>
            These items have fallen below their reorder level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reorder At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item: InventoryItem) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.stock}</Badge>
                    </TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    All items are well-stocked.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
