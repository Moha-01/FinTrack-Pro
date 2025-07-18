// Fassen Sie Finanzdaten zusammen, um Trends und Muster zu erkennen.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialDataSummaryInputSchema = z.object({
  income: z
    .array(z.object({
      source: z.string().describe('Die Einkommensquelle.'),
      amount: z.number().describe('Der Einkommensbetrag.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('Die Wiederkehr des Einkommens.'),
    }))
    .describe('Die Einkommensdaten des Benutzers.'),
  expenses: z
    .array(z.object({
      category: z.string().describe('Die Ausgabenkategorie.'),
      amount: z.number().describe('Der Ausgabenbetrag.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('Die Wiederkehr der Ausgabe.'),
    }))
    .describe('Die Ausgabendaten des Benutzers.'),
  recurringPayments: z
    .array(z.object({
      name: z.string().describe('Der Name der Zahlung.'),
      rate: z.number().describe('Die Zahlungshöhe.'),
      completionDate: z.string().describe('Das Abschlussdatum der Zahlung.'),
    }))
    .describe('Die wiederkehrenden Zahlungsdaten des Benutzers.'),
});
export type FinancialDataSummaryInput = z.infer<typeof FinancialDataSummaryInputSchema>;

const FinancialDataSummaryOutputSchema = z.object({
  summary: z.string().describe('Eine Zusammenfassung der Finanzdaten des Benutzers.'),
});
export type FinancialDataSummaryOutput = z.infer<typeof FinancialDataSummaryOutputSchema>;

export async function summarizeFinancialData(input: FinancialDataSummaryInput): Promise<FinancialDataSummaryOutput> {
  return financialDataSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialDataSummaryPrompt',
  input: {schema: FinancialDataSummaryInputSchema},
  output: {schema: FinancialDataSummaryOutputSchema},
  prompt: `Sie sind ein Experte für persönliche Finanzen. Geben Sie eine Zusammenfassung der Finanzdaten des Benutzers, einschließlich Einnahmen, Ausgaben und wiederkehrenden Zahlungen. Identifizieren Sie alle Trends oder Muster in den Daten.

Einkommen:
{{#each income}}
- Quelle: {{source}}, Betrag: {{amount}}, Wiederkehr: {{recurrence}}
{{/each}}

Ausgaben:
{{#each expenses}}
- Kategorie: {{category}}, Betrag: {{amount}}, Wiederkehr: {{recurrence}}
{{/each}}

Wiederkehrende Zahlungen:
{{#each recurringPayments}}
- Name: {{name}}, Rate: {{rate}}, Abschlussdatum: {{completionDate}}
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
