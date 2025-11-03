"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { InventoryItem } from "@/lib/types"
import { AddItemForm } from "./add-item-form"
import { deleteItem } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

type InventoryTableProps = {
    data: InventoryItem[]
    onItemAdded: (item: InventoryItem) => void;
    onItemUpdated: (item: InventoryItem) => void;
    onItemDeleted: (id: string) => void;
    openAddDialog?: boolean
    newItemData?: Partial<InventoryItem>
    itemToEdit?: InventoryItem;
    itemToView?: InventoryItem;
    itemToDelete?: InventoryItem;
}

export function InventoryTable({ 
  data, 
  onItemAdded, 
  onItemUpdated, 
  onItemDeleted,
  openAddDialog,
  newItemData,
  itemToEdit,
  itemToView,
  itemToDelete
}: InventoryTableProps) {
  const { toast } = useToast()
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = React.useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<InventoryItem | null>(null);

  const clearUrlParams = () => {
    router.replace('/dashboard/inventory', { scroll: false });
  }

  React.useEffect(() => {
    if (openAddDialog) {
      setIsAddFormOpen(true);
    }
  }, [openAddDialog]);

  React.useEffect(() => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
    }
  }, [itemToEdit]);
  
  React.useEffect(() => {
    if (itemToView) {
      setViewingItem(itemToView);
    }
  }, [itemToView]);

  React.useEffect(() => {
    if (itemToDelete) {
      setDeletingItem(itemToDelete);
    }
  }, [itemToDelete]);

  const confirmDelete = async () => {
    if (deletingItem) {
      try {
        await deleteItem(deletingItem.id);
        onItemDeleted(deletingItem.id); // Optimistic update
        toast({
          title: "Item Deleted",
          description: `Successfully deleted "${deletingItem.name}".`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the item.",
        });
      } finally {
        setDeletingItem(null);
        clearUrlParams();
      }
    }
  };

  const columns: ColumnDef<InventoryItem>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.id}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "stock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
          const item = row.original;
          const inStock = item.stock > item.reorderLevel;
          const lowStock = item.stock > 0 && item.stock <= item.reorderLevel;
          const outOfStock = item.stock === 0;
  
          return (
              <div className="flex flex-col text-left">
                  <span className="font-mono">{item.stock}</span>
                  {inStock && <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">In Stock</Badge>}
                  {lowStock && <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 w-fit">Low Stock</Badge>}
                  {outOfStock && <Badge variant="destructive">Out of Stock</Badge>}
              </div>
          )
      },
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(String(row.getValue("price")))
        return <div className="text-right font-medium">{formatCurrency(amount)}</div>
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingItem(item)}>Edit Product</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewingItem(item)}>View Details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem(item)}>
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [onItemUpdated, onItemDeleted]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onItemUpdated: onItemUpdated,
    }
  })
  
  const handleAddSuccess = (newItem: InventoryItem) => {
    onItemAdded(newItem);
    setIsAddFormOpen(false)
    clearUrlParams();
  }

  const handleEditSuccess = (updatedItem: InventoryItem) => {
    onItemUpdated(updatedItem); // Optimistic update
    setEditingItem(null);
    clearUrlParams();
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter products by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Dialog open={isAddFormOpen} onOpenChange={(isOpen) => {
          setIsAddFormOpen(isOpen);
          if (!isOpen) clearUrlParams();
        }}>
            <DialogTrigger asChild>
                 <Button className="ml-auto" onClick={() => setIsAddFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new product to your inventory.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <AddItemForm 
                      onSuccess={handleAddSuccess} 
                      initialData={newItemData}
                    />
                </div>
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
       {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(isOpen) => {
        if(!isOpen) {
          setEditingItem(null);
          clearUrlParams();
        } else {
          setEditingItem(editingItem);
        }
      }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for "{editingItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AddItemForm
              onSuccess={handleEditSuccess}
              initialData={editingItem!}
              isEditing
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(isOpen) => {
        if(!isOpen) {
          setViewingItem(null);
          clearUrlParams();
        } else {
          setViewingItem(viewingItem);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingItem?.name}</DialogTitle>
            <DialogDescription>Product ID: {viewingItem?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Stock:</span>
              <span>{viewingItem?.stock}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Price:</span>
              <span>{formatCurrency(viewingItem?.price || 0)}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Reorder Level:</span>
              <span>{viewingItem?.reorderLevel}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Category:</span>
              <span>{viewingItem?.category}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Supplier:</span>
              <span>{viewingItem?.supplier}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-semibold">Last Updated:</span>
              <span>{viewingItem ? new Date(viewingItem.lastUpdated).toLocaleString() : ''}</span>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deletingItem} onOpenChange={(isOpen) => {
          if(!isOpen) {
            setDeletingItem(null);
            clearUrlParams();
          } else {
            setDeletingItem(deletingItem);
          }
       }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{deletingItem?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
