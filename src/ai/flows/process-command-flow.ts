/**
 * @fileOverview This file defines a Genkit flow for processing natural language voice commands.
 * It interprets the user's intent and extracts relevant entities to return a structured action.
 *
 * - processCommand - A function that handles the command processing.
 */
import {ai} from '@/ai/genkit';
import {
  ProcessCommandInputSchema,
  ProcessCommandOutputSchema,
  type ProcessCommandInput,
  type ProcessCommandOutput,
} from '@/lib/types';

export async function processCommand(
  input: ProcessCommandInput
): Promise<ProcessCommandOutput> {
  return processCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processCommandPrompt',
  input: {schema: ProcessCommandInputSchema},
  output: {schema: ProcessCommandOutputSchema},
  prompt: `You are an expert inventory management AI. Your task is to interpret a voice command and convert it into a structured action.

  You have access to the current inventory state. Use it to resolve ambiguities. For example, if the user says "remove all cola", you should find the item "Classic Cola" and set the quantity to its current stock.

  Current Inventory:
  {{#each inventory}}
  - {{this.name}}: {{this.stock}} in stock
  {{/each}}

  Analyze the user's command: "{{command}}"

  Determine the user's intent and extract the necessary entities.
  The possible actions are:
  - ADD_STOCK: For increasing the quantity of an item. Requires itemName and quantity.
  - REMOVE_STOCK: For decreasing the quantity of an item. Requires itemName and quantity.
  - CHECK_STOCK: For checking the current stock of an item. Requires itemName.
  - SET_REORDER_ALERT: For setting a low-stock notification threshold. Requires itemName and threshold.
  - GENERATE_SALES_REPORT: For creating a report.
  - ADD_NEW_ITEM: For when the user wants to add a completely new product. It can optionally include quantity, price, and reorderLevel.
  - EDIT_ITEM: To modify an existing item. Requires the itemName and can optionally include new values for stock, price, reorderLevel, category, or supplier.
  - VIEW_ITEM_DETAILS: To see the details of a specific item. Requires the itemName.
  - DELETE_ITEM: To remove an item from inventory. Requires the itemName.
  - UNKNOWN_COMMAND: If the command is unclear, ambiguous, or not related to inventory management.

  If a command is to "add" or "put" something, it's ADD_STOCK.
  If a command is to "remove", "sell", or "take" something, it's REMOVE_STOCK.
  If a command is asking "how many", "quantity of", or to "check stock", it's CHECK_STOCK.
  If the command is to "add a new item" or "create a new product", it is ADD_NEW_ITEM.
  If a command is to "edit", "update", or "change" an item, it's EDIT_ITEM. For example, "change the price of milk to 100" is an EDIT_ITEM action.
  If a command is to "view details", "show me", or "get details for" an item, it's VIEW_ITEM_DETAILS.
  If a command is to "delete", "remove", or "discard" an item, it's DELETE_ITEM.
  If the user says "all" or "everything" for a quantity, use the current stock number for that item.

  When adding a new item, extract the item name and optionally the initial stock (quantity), price, and reorder level if mentioned.
  When editing an item, extract the item name and any new values for its properties that are mentioned in the command.
  When viewing, or deleting an item, you MUST extract the itemName.

  If you cannot determine the action or required parameters, use the UNKNOWN_COMMAND action with an explanatory message.

  Respond ONLY with the JSON object that corresponds to the identified action.`,
});

const processCommandFlow = ai.defineFlow(
  {
    name: 'processCommandFlow',
    inputSchema: ProcessCommandInputSchema,
    outputSchema: ProcessCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
