import {z} from 'genkit';

export const FinancialDataSummaryInputSchema = z.object({
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
      amount: z.number().describe('Die Zahlungshöhe.'),
      completionDate: z.string().describe('Das Abschlussdatum der Zahlung.'),
    }))
    .describe('Die wiederkehrenden Zahlungsdaten des Benutzers.'),
});
export type FinancialDataSummaryInput = z.infer<typeof FinancialDataSummaryInputSchema>;

export const FinancialDataSummaryOutputSchema = z.object({
  summary: z.string().describe('Eine Zusammenfassung der Finanzdaten des Benutzers mit Einblicken und Empfehlungen.'),
});
export type FinancialDataSummaryOutput = z.infer<typeof FinancialDataSummaryOutputSchema>;
