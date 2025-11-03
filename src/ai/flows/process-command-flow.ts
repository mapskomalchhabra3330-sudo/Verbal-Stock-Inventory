'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing natural language voice commands.
 * It interprets the user's intent and extracts relevant entities to return a structured action.
 *
 * - processCommand - A function that handles the command processing.
 * - ProcessCommandInput - The input type for the processCommand function.
 * - ProcessCommandOutput - The return type for the processCommand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessCommandInputSchema = z.object({
  command: z.string().describe('The voice command spoken by the user.'),
});
export type ProcessCommandInput = z.infer<typeof ProcessCommandInputSchema>;

const ProcessCommandOutputSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ADD_STOCK'),
    itemName: z.string().describe('The name of the item to add stock for.'),
    quantity: z.number().describe('The quantity of the item to add.'),
  }),
  z.object({
    action: z.literal('REMOVE_STOCK'),
    itemName: z.string().describe('The name of the item to remove stock from.'),
    quantity: z.number().describe('The quantity of the item to remove.'),
  }),
  z.object({
    action: z.literal('CHECK_STOCK'),
    itemName: z.string().describe('The name of the item to check the stock of.'),
  }),
  z.object({
    action: z.literal('SET_REORDER_ALERT'),
    itemName: z.string().describe('The name of the item to set the reorder alert for.'),
    threshold: z.number().describe('The stock level at which to trigger the alert.'),
  }),
  z.object({
    action: z.literal('GENERATE_SALES_REPORT'),
    reportType: z.string().optional().describe('The type of report, e.g., "daily", "weekly", "most demanded".'),
  }),
  z.object({
    action: z.literal('ADD_NEW_ITEM'),
    message: z.string().describe('A confirmation message for opening the add item dialog.')
  }),
  z.object({
    action: z.literal('UNKNOWN_COMMAND'),
    message: z.string().describe('A message explaining that the command was not understood.'),
  }),
]);

export type ProcessCommandOutput = z.infer<typeof ProcessCommandOutputSchema>;

export async function processCommand(input: ProcessCommandInput): Promise<ProcessCommandOutput> {
  return processCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processCommandPrompt',
  input: { schema: ProcessCommandInputSchema },
  output: { schema: ProcessCommandOutputSchema },
  prompt: `You are an expert inventory management AI. Your task is to interpret a voice command and convert it into a structured action.

  Analyze the user's command: "{{command}}"

  Determine the user's intent and extract the necessary entities.
  The possible actions are:
  - ADD_STOCK: For increasing the quantity of an item. Requires itemName and quantity.
  - REMOVE_STOCK: For decreasing the quantity of an item. Requires itemName and quantity.
  - CHECK_STOCK: For checking the current stock of an item. Requires itemName.
  - SET_REORDER_ALERT: For setting a low-stock notification threshold. Requires itemName and threshold.
  - GENERATE_SALES_REPORT: For creating a report.
  - ADD_NEW_ITEM: For when the user wants to add a completely new product.
  - UNKNOWN_COMMAND: If the command is unclear, ambiguous, or not related to inventory management.

  If a command is to "add" or "put" something, it's ADD_STOCK.
  If a command is to "remove", "sell", or "take" something, it's REMOVE_STOCK.
  If a command is asking "how many", "quantity of", or to "check stock", it's CHECK_STOCK.
  If the command is to "add a new item" or "create a new product", it is ADD_NEW_ITEM.

  If you cannot determine the action or required parameters, use the UNKNOWN_COMMAND action with an explanatory message.

  Respond ONLY with the JSON object that corresponds to the identified action.`,
});

const processCommandFlow = ai.defineFlow(
  {
    name: 'processCommandFlow',
    inputSchema: ProcessCommandInputSchema,
    outputSchema: ProcessCommandOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
