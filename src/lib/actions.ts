'use server'

import { revalidatePath } from 'next/cache'
import { generateSalesReport } from '@/ai/flows/generate-sales-report'
import { setReorderAlert } from '@/ai/flows/voice-based-reorder-alerts'
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
  const lowerCaseCommand = command.toLowerCase();

  // Regex patterns for various commands
  const addStockRegex = /(?:add|increase|put)\s*(\d+)\s*(?:units? of)?\s*(.+)/i;
  const removeStockRegex = /(?:remove|decrease|take|sell)\s*(\d+)\s*(?:units? of)?\s*(.+)/i;
  const checkStockRegex = /(?:check|how many|quantity of|what's the stock of)\s*(.+)/i;
  const setAlertRegex = /set\s*(?:reorder)?\s*alert for\s*(.+?)\s*at\s*(\d+)/i;
  const generateReportRegex = /generate\s*(.+?)\s*report/i;
  const addNewItemRegex = /add\s*(?:a)?\s*new item/i;

  let match;

  if (addNewItemRegex.test(lowerCaseCommand)) {
    return { success: true, message: 'Opening form to add a new item.', action: 'OPEN_ADD_ITEM_DIALOG' };
  }

  match = lowerCaseCommand.match(addStockRegex);
  if (match) {
    const [, quantity, itemName] = match;
    const item = await updateStock(itemName.trim(), parseInt(quantity));
    if (item) {
      return { success: true, message: `Added ${quantity} units to ${item.name}. New stock is ${item.stock}.`, action: 'REFRESH_INVENTORY' };
    }
    return { success: false, message: `Could not find item "${itemName.trim()}".` };
  }

  match = lowerCaseCommand.match(removeStockRegex);
  if (match) {
    const [, quantity, itemName] = match;
    const item = await updateStock(itemName.trim(), -parseInt(quantity));
    if (item) {
      return { success: true, message: `Removed ${quantity} units from ${item.name}. New stock is ${item.stock}.`, action: 'REFRESH_INVENTORY' };
    }
    return { success: false, message: `Could not find item "${itemName.trim()}".` };
  }
  
  match = lowerCaseCommand.match(setAlertRegex);
  if (match) {
    const [, item, threshold] = match;
    try {
        const result = await setReorderAlert({ item: item.trim(), threshold: parseInt(threshold) });
        if (result.success) {
            const itemToUpdate = mockInventory.find(i => i.name.toLowerCase().includes(item.trim().toLowerCase()));
            if(itemToUpdate) {
                itemToUpdate.reorderLevel = parseInt(threshold);
                revalidatePath('/dashboard/inventory');
            }
        }
        return { success: result.success, message: result.message, action: 'REFRESH_INVENTORY' };
    } catch (error) {
        return { success: false, message: "Sorry, I couldn't set the reorder alert." };
    }
  }

  match = lowerCaseCommand.match(generateReportRegex);
  if (match) {
    try {
      const result = await generateSalesReport({ voiceCommand: command });
      return { success: true, message: `This month's most demanded product is: ${result.mostDemandedProduct}.`, data: result };
    } catch (error) {
      return { success: false, message: "Sorry, I couldn't generate the report." };
    }
  }

  match = lowerCaseCommand.match(checkStockRegex);
  if (match) {
    const [, itemName] = match;
    const item = await getItemByName(itemName.replace(/\?$/, '').trim());
    if (item) {
      return { success: true, message: `You have ${item.stock} units of ${item.name} in stock.` };
    }
    return { success: false, message: `Could not find item "${itemName.trim()}".` };
  }

  return { success: false, message: "Sorry, I didn't understand that command." };
}
