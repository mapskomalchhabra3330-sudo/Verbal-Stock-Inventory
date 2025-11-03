"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect } from "react"

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
import { addItem, updateItem } from "@/lib/actions"
import type { InventoryItem } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  category: z.string().min(2, "Category is required."),
  supplier: z.string().min(2, "Supplier is required."),
})

type AddItemFormValues = z.infer<typeof formSchema>

type AddItemFormProps = {
  onSuccess: (item: InventoryItem) => void;
  initialData?: Partial<InventoryItem>;
  isEditing?: boolean;
}

export function AddItemForm({ onSuccess, initialData, isEditing = false }: AddItemFormProps) {
  const { toast } = useToast()
  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      stock: 0,
      reorderLevel: 10,
      price: 0,
      category: "",
      supplier: "",
      ...initialData,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: "",
        stock: 0,
        reorderLevel: 10,
        price: 0,
        category: "",
        supplier: "",
        ...initialData
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: AddItemFormValues) {
    try {
      if (isEditing) {
        if (!initialData?.id) throw new Error("Item ID is missing for editing.");
        const updatedItem = await updateItem(initialData.id, values);
         toast({
          title: "Item Updated",
          description: `Successfully updated "${updatedItem.name}".`,
        });
        onSuccess(updatedItem);
      } else {
        const newItem = await addItem(values);
        toast({
          title: "Item Added",
          description: `Successfully added "${newItem.name}" to your inventory.`,
        });
        onSuccess(newItem);
        form.reset();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} the item. Please try again.`,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} value={field.value || ''} />
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
                      <FormLabel>Price (Rs)</FormLabel>
                      <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
              </div>
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Alert when stock hits this level.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>
        
        <div className="flex justify-end">
             <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditing ? "Saving..." : "Adding..."
                : isEditing ? "Save Changes" : "Add Product"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
