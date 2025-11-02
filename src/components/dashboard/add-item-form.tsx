"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addItem } from "@/lib/actions"
import type { InventoryItem } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  category: z.string().min(2, "Category is required."),
  supplier: z.string().min(2, "Supplier is required."),
})

type AddItemFormProps = {
  onSuccess?: (item: InventoryItem) => void;
}

export function AddItemForm({ onSuccess }: AddItemFormProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      stock: 0,
      reorderLevel: 10,
      price: 0,
      category: "",
      supplier: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newItem = await addItem(values);
      toast({
        title: "Item Added",
        description: `Successfully added "${newItem.name}" to your inventory.`,
      })
      onSuccess?.(newItem);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the item. Please try again.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
                <div className="relative group">
                    <div className="size-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                        <Camera className="size-8 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" variant="outline" size="sm">Change</Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Whole Milk" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (INR)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="reorderLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                 <FormDescription>Alert when stock hits this level.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dairy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Farm Fresh" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding..." : "Add Product"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
