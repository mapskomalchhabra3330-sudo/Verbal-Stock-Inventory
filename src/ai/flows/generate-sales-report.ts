'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating sales reports based on voice commands.
 *
 * It takes voice commands as input and returns a structured report of the most demanded product.
 * - generateSalesReport - A function that handles the sales report generation process.
 */

import {ai} from '@/ai/genkit';
import { GenerateSalesReportInputSchema, GenerateSalesReportOutputSchema, type GenerateSalesReportInput, type GenerateSalesReportOutput } from '@/lib/types';

export async function generateSalesReport(
  input: GenerateSalesReportInput
): Promise<GenerateSalesReportOutput> {
  return generateSalesReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesReportPrompt',
  input: {schema: GenerateSalesReportInputSchema},
  output: {schema: GenerateSalesReportOutputSchema},
  prompt: `You are an AI assistant that generates sales reports based on voice commands.
  Based on the voice command: "{{voiceCommand}}", determine the most demanded product.
  Return the name of the most demanded product in the output.`,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: GenerateSalesReportInputSchema,
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
