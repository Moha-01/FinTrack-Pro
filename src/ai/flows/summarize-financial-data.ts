// Summarize financial data to identify trends and patterns.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialDataSummaryInputSchema = z.object({
  income: z
    .array(z.object({
      source: z.string().describe('The source of the income.'),
      amount: z.number().describe('The amount of income.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('The recurrence of the income.'),
    }))
    .describe('The user income data.'),
  expenses: z
    .array(z.object({
      category: z.string().describe('The category of the expense.'),
      amount: z.number().describe('The amount of the expense.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('The recurrence of the expense.'),
    }))
    .describe('The user expense data.'),
  recurringPayments: z
    .array(z.object({
      name: z.string().describe('The name of the payment.'),
      rate: z.number().describe('The payment rate.'),
      completionDate: z.string().describe('The completion date of the payment.'),
    }))
    .describe('The user recurring payment data.'),
});
export type FinancialDataSummaryInput = z.infer<typeof FinancialDataSummaryInputSchema>;

const FinancialDataSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the user financial data.'),
});
export type FinancialDataSummaryOutput = z.infer<typeof FinancialDataSummaryOutputSchema>;

export async function summarizeFinancialData(input: FinancialDataSummaryInput): Promise<FinancialDataSummaryOutput> {
  return financialDataSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialDataSummaryPrompt',
  input: {schema: FinancialDataSummaryInputSchema},
  output: {schema: FinancialDataSummaryOutputSchema},
  prompt: `You are a personal finance expert. Provide a summary of the user's financial data, including income, expenses, and recurring payments. Identify any trends or patterns in the data.

Income:
{{#each income}}
- Source: {{source}}, Amount: {{amount}}, Recurrence: {{recurrence}}
{{/each}}

Expenses:
{{#each expenses}}
- Category: {{category}}, Amount: {{amount}}, Recurrence: {{recurrence}}
{{/each}}

Recurring Payments:
{{#each recurringPayments}}
- Name: {{name}}, Rate: {{rate}}, Completion Date: {{completionDate}}
{{/each}}`,
});

const financialDataSummaryFlow = ai.defineFlow(
  {
    name: 'financialDataSummaryFlow',
    inputSchema: FinancialDataSummaryInputSchema,
    outputSchema: FinancialDataSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);