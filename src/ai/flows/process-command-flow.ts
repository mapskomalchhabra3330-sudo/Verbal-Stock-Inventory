/**
 * @fileOverview This file defines a Genkit flow for processing natural language voice commands.
 * It interprets the user's intent and extracts relevant entities to return a structured action.
 *
 * - processCommand - A function that handles the command processing.
 */

import { ai } from '@/ai/genkit';
import { ProcessCommandInputSchema, ProcessCommandOutputSchema, type ProcessCommandInput, type ProcessCommandOutput } from '@/lib/types';


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
