import { z } from 'zod';

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  price: number;
  category: string;
  supplier: string;
  imageUrl: string;
  lastUpdated: string;
};

// Types for process-command-flow.ts
export const ProcessCommandInputSchema = z.object({
  command: z.string().describe('The voice command spoken by the user.'),
  inventory: z.array(z.object({
    name: z.string(),
    stock: z.number(),
  })).optional().describe('The current list of inventory items and their stock counts.')
});
export type ProcessCommandInput = z.infer<typeof ProcessCommandInputSchema>;

export const ProcessCommandOutputSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.enum(['ADD_STOCK']),
    itemName: z.string().describe('The name of the item to add stock for.'),
    quantity: z.number().describe('The quantity of the item to add.'),
  }),
  z.object({
    action: z.enum(['REMOVE_STOCK']),
    itemName: z.string().describe('The name of the item to remove stock from.'),
    quantity: z.number().describe('The quantity of the item to remove.'),
  }),
  z.object({
    action: z.enum(['CHECK_STOCK']),
    itemName: z.string().describe('The name of the item to check the stock of.'),
  }),
  z.object({
    action: z.enum(['SET_REORDER_ALERT']),
    itemName: z.string().describe('The name of the item to set the reorder alert for.'),
    threshold: z.number().describe('The stock level at which to trigger the alert.'),
  }),
  z.object({
    action: z.enum(['GENERATE_SALES_REPORT']),
    reportType: z.string().optional().describe('The type of report, e.g., "daily", "weekly", "most demanded".'),
  }),
  z.object({
    action: z.enum(['ADD_NEW_ITEM']),
    message: z.string().describe('A confirmation message for opening the add item dialog.')
  }),
  z.object({
    action: z.enum(['UNKNOWN_COMMAND']),
    message: z.string().describe('A message explaining that the command was not understood.'),
  }),
]);
export type ProcessCommandOutput = z.infer<typeof ProcessCommandOutputSchema>;


// Types for voice-based-reorder-alerts.ts
export const SetReorderAlertInputSchema = z.object({
  item: z.string().describe('The name of the item to set the reorder alert for.'),
  threshold: z.number().describe('The quantity at which a reorder alert should be triggered.'),
});
export type SetReorderAlertInput = z.infer<typeof SetReorderAlertInputSchema>;

export const SetReorderAlertOutputSchema = z.object({
  success: z.boolean().describe('Whether the reorder alert was successfully set.'),
  message: z.string().describe('A message confirming the alert was set, or an error message if not.'),
});
export type SetReorderAlertOutput = z.infer<typeof SetReorderAlertOutputSchema>;

// Types for generate-sales-report.ts
export const GenerateSalesReportInputSchema = z.object({
  voiceCommand: z
    .string()
    .describe(
      'A voice command requesting a sales report, e.g., \'generate daily sales report\''
    ),
});
export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

export const GenerateSalesReportOutputSchema = z.object({
  mostDemandedProduct: z
    .string()
    .describe('The name of the most demanded product in the sales report.'),
});
export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

// General response type for voice commands in UI
export type VoiceCommandResponse = {
  success: boolean;
  message: string;
  action?: 'REFRESH_DASHBOARD' | 'REFRESH_INVENTORY' | 'OPEN_ADD_ITEM_DIALOG' | null;
  data?: any;
};
