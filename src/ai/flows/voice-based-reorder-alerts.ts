'use server';
/**
 * @fileOverview This file defines a Genkit flow for setting reorder alerts via voice command.
 *
 * - setReorderAlert - A function that handles the process of setting a reorder alert.
 */

import {ai} from '@/ai/genkit';
import { SetReorderAlertInputSchema, SetReorderAlertOutputSchema, type SetReorderAlertInput, type SetReorderAlertOutput } from '@/lib/types';


export async function setReorderAlert(input: SetReorderAlertInput): Promise<SetReorderAlertOutput> {
  return setReorderAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'setReorderAlertPrompt',
  input: {schema: SetReorderAlertInputSchema},
  output: {schema: SetReorderAlertOutputSchema},
  prompt: `You are an inventory management assistant. The user wants to set a reorder alert for an item.

  Item: {{{item}}}
  Threshold: {{{threshold}}}

  Confirm that you have set a reorder alert when the stock level of item {{{item}}} falls to {{{threshold}}}. Return a success boolean and message confirming this.
  If the item or threshold are invalid, return success as false with an appropriate error message.
  Always respond in the format defined by the SetReorderAlertOutputSchema schema.
  `,
});

const setReorderAlertFlow = ai.defineFlow(
  {
    name: 'setReorderAlertFlow',
    inputSchema: SetReorderAlertInputSchema,
    outputSchema: SetReorderAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
