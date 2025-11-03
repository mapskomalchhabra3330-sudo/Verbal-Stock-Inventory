'use server'

import { revalidatePath } from 'next/cache'
import { processCommand } from '@/ai/flows/process-command-flow'
import { inventory } from './data'
import type { InventoryItem, VoiceCommandResponse } from './types'

// This is a hack for the demo to simulate a database.
// In a real application, you would use a proper database like Firestore.
let mockInventory: InventoryItem[] = [...inventory];

export async function getInventory(): Promise<InventoryItem[]> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
    return JSON.parse(JSON.stringify(mockInventory));
}

export async function getItemByName(name: string): Promise<InventoryItem | undefined> {
    const item = mockInventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    return item ? JSON.parse(JSON.stringify(item)) : undefined;
}

export async function addItem(itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
        id: `ITEM-${String(mockInventory.length + 1).padStart(3, '0')}`,
        ...itemData,
        lastUpdated: new Date().toISOString(),
    };
    mockInventory.unshift(newItem);
    return JSON.parse(JSON.stringify(newItem));
}

export async function updateItem(id: string, itemData: Partial<Omit<InventoryItem, 'id' | 'lastUpdated'>>): Promise<InventoryItem> {
    const itemIndex = mockInventory.findIndex(i => i.id === id);
    if (itemIndex > -1) {
        mockInventory[itemIndex] = {
            ...mockInventory[itemIndex],
            ...itemData,
            lastUpdated: new Date().toISOString(),
        };
        return JSON.parse(JSON.stringify(mockInventory[itemIndex]));
    }
    throw new Error("Item not found");
}

export async function deleteItem(id: string): Promise<{ success: true }> {
    const initialLength = mockInventory.length;
    mockInventory = mockInventory.filter(item => item.id !== id);
    if (mockInventory.length === initialLength) {
        throw new Error("Item not found");
    }
    return { success: true };
}


export async function updateStock(itemName: string, quantityChange: number): Promise<InventoryItem | null> {
    const itemIndex = mockInventory.findIndex(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

    if (itemIndex > -1) {
        mockInventory[itemIndex].stock += quantityChange;
        mockInventory[itemIndex].lastUpdated = new Date().toISOString();
        
        return JSON.parse(JSON.stringify(mockInventory[itemIndex]));
    }
    return null;
}

export async function processVoiceCommand(command: string): Promise<VoiceCommandResponse> {
  try {
    const currentInventory = await getInventory();
    const result = await processCommand({ 
        command,
        inventory: currentInventory.map(item => ({ name: item.name, stock: item.stock }))
    });

    switch (result.action) {
      case 'ADD_STOCK': {
        const { itemName, quantity } = result;
        if (!itemName || quantity === undefined) return { success: false, message: "I didn't catch the item name or quantity." };
        const item = await updateStock(itemName, quantity);
        if (item) {
          return { success: true, message: `Added ${quantity} units to ${item.name}. New stock is ${item.stock}.`, action: 'REFRESH_INVENTORY' };
        }
        return { success: false, message: `Could not find item "${itemName}".` };
      }
      
      case 'REMOVE_STOCK': {
        const { itemName, quantity } = result;
        if (!itemName || quantity === undefined) return { success: false, message: "I didn't catch the item name or quantity." };
        const item = await updateStock(itemName, -quantity);
        if (item) {
          return { success: true, message: `Removed ${quantity} units from ${item.name}. New stock is ${item.stock}.`, action: 'REFRESH_INVENTORY' };
        }
        return { success: false, message: `Could not find item "${itemName}".` };
      }

      case 'CHECK_STOCK': {
        const { itemName } = result;
        if (!itemName) return { success: false, message: "I didn't catch the item name." };
        const item = await getItemByName(itemName);
        if (item) {
          return { success: true, message: `You have ${item.stock} units of ${item.name} in stock.` };
        }
        return { success: false, message: `Could not find item "${itemName}".` };
      }

      case 'SET_REORDER_ALERT': {
        const { itemName, threshold } = result;
        if (!itemName || threshold === undefined) return { success: false, message: "I didn't catch the item name or threshold." };
        const itemToUpdate = mockInventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
        if (itemToUpdate) {
            itemToUpdate.reorderLevel = threshold;
            return { success: true, message: `Reorder alert for ${itemToUpdate.name} set to ${threshold}.`, action: 'REFRESH_INVENTORY' };
        }
        return { success: false, message: `Could not find item "${itemName}".` };
      }

      case 'ADD_NEW_ITEM': {
        const { itemName, quantity, price, reorderLevel } = result;
        const data: any = {};
        if (itemName) data.itemName = itemName;
        if (quantity !== undefined) data.quantity = quantity;
        if (price !== undefined) data.price = price;
        if (reorderLevel !== undefined) data.reorderLevel = reorderLevel;

        return { 
            success: true, 
            message: `I'll open a form to add "${itemName || 'a new item'}".`, 
            action: 'OPEN_ADD_ITEM_DIALOG',
            data: data
        };
      }
      
      case 'EDIT_ITEM': {
        const { itemName, ...updates } = result;
        if (!itemName) return { success: false, message: "I didn't catch which item to edit." };

        const itemToUpdate = await getItemByName(itemName);
        if (!itemToUpdate) {
          return { success: false, message: `Could not find item "${itemName}".` };
        }

        const hasUpdates = Object.values(updates).some(val => val !== undefined);

        if (hasUpdates) {
          const updatedItem = await updateItem(itemToUpdate.id, updates);
          let updateMessages: string[] = [];
          if (updates.price !== undefined) updateMessages.push(`price to ${updatedItem.price}`);
          if (updates.stock !== undefined) updateMessages.push(`stock to ${updatedItem.stock}`);
          if (updates.reorderLevel !== undefined) updateMessages.push(`reorder level to ${updatedItem.reorderLevel}`);
          if (updates.category !== undefined) updateMessages.push(`category to ${updatedItem.category}`);
          if (updates.supplier !== undefined) updateMessages.push(`supplier to ${updatedItem.supplier}`);

          return { 
            success: true, 
            message: `Updated ${updatedItem.name}: set ${updateMessages.join(', ')}.`,
            action: 'REFRESH_INVENTORY'
          };
        }

        return { 
            success: true, 
            message: `Sure, I can help with that. Opening the edit form for ${itemName}.`, 
            action: 'OPEN_EDIT_DIALOG',
            data: { itemName }
        };
      }

      case 'VIEW_ITEM_DETAILS': {
        const { itemName } = result;
        if (!itemName) return { success: false, message: "I didn't catch which item to view." };
        return { 
            success: true, 
            message: `Here are the details for ${itemName}.`, 
            action: 'OPEN_VIEW_DIALOG',
            data: { itemName }
        };
      }

      case 'DELETE_ITEM': {
        const { itemName } = result;
        if (!itemName) return { success: false, message: "I didn't catch which item to delete." };
        return { 
            success: true, 
            message: `Are you sure you want to delete ${itemName}?`, 
            action: 'OPEN_DELETE_DIALOG',
            data: { itemName }
        };
      }

      case 'GENERATE_SALES_REPORT': {
        const mostDemanded = mockInventory.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        return { success: true, message: `This month's most demanded product is: ${mostDemanded.name}.`, data: { mostDemandedProduct: mostDemanded.name } };
      }

      case 'UNKNOWN_COMMAND':
      default:
        return { success: false, message: result.message || "Sorry, I didn't understand that command." };
    }
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
}
