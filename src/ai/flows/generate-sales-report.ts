'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating sales reports based on voice commands.
 *
 * It takes voice commands as input and returns a structured report of the most demanded product.
 * - generateSalesReport - A function that handles the sales report generation process.
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesReportInputSchema = z.object({
  voiceCommand: z
    .string()
    .describe(
      'A voice command requesting a sales report, e.g., \'generate daily sales report\''
    ),
});
export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

const GenerateSalesReportOutputSchema = z.object({
  mostDemandedProduct: z
    .string()
    .describe('The name of the most demanded product in the sales report.'),
});
export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

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
