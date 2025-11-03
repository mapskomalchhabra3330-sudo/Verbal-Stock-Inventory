'use server'

import { revalidatePath } from 'next/cache'
import { processCommand } from '@/ai/flows/process-command-flow'
import { inventory } from './data'
import type { InventoryItem, VoiceCommandResponse } from './types'

// This is a hack for the demo to simulate a database.
// In a real application, you would use a proper database like Firestore.
let mockInventory: InventoryItem[] = [...inventory];

export async function getInventory(): Promise<InventoryItem[]> {
    return JSON.parse(JSON.stringify(mockInventory));
}

export async function getItemByName(name: string): Promise<InventoryItem | undefined> {
    const item = mockInventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    return item ? JSON.parse(JSON.stringify(item)) : undefined;
}

export async function addItem(itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'imageUrl'> & { imageUrl?: string }): Promise<InventoryItem> {
    const newItem: InventoryItem = {
        id: `ITEM-${String(mockInventory.length + 1).padStart(3, '0')}`,
        ...itemData,
        imageUrl: itemData.imageUrl || '',
        lastUpdated: new Date().toISOString(),
    };
    mockInventory.unshift(newItem);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/inventory');
    return JSON.parse(JSON.stringify(newItem));
}

export async function updateStock(itemName: string, quantityChange: number): Promise<InventoryItem | null> {
    const itemIndex = mockInventory.findIndex(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

    if (itemIndex > -1) {
        mockInventory[itemIndex].stock += quantityChange;
        mockInventory[itemIndex].lastUpdated = new Date().toISOString();
        
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/inventory');
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
            revalidatePath('/dashboard/inventory');
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
            message: `Opening form to add "${itemName || 'a new item'}".`, 
            action: 'OPEN_ADD_ITEM_DIALOG',
            data: data
        };
      }
      
      case 'GENERATE_SALES_REPORT': {
         // In a real app, the LLM could determine the most demanded product from data.
         // For now, we'll return a mock response.
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
    return { success: false, message: `Error: ${errorMessage}` };
  }
}
