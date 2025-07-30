// NOTE: This file is used by Genkit flows and should not be imported in
// the client-side code.
import { z } from 'zod';

export const incomeSchema = z.object({
  id: z.string(),
  type: z.literal('income'),
  source: z.string(),
  amount: z.number(),
  recurrence: z.enum(['monthly', 'yearly']),
  date: z.string(),
});

export const oneTimeIncomeSchema = z.object({
  id: z.string(),
  type: z.literal('oneTimeIncome'),
  source: z.string(),
  amount: z.number(),
  date: z.string(),
});

export const expenseSchema = z.object({
  id: z.string(),
  type: z.literal('expense'),
  category: z.string(),
  amount: z.number(),
  recurrence: z.enum(['monthly', 'yearly']),
  date: z.string(),
});

export const recurringPaymentSchema = z.object({
  id: z.string(),
  type: z.literal('payment'),
  name: z.string(),
  amount: z.number(),
  date: z.string(),
  numberOfPayments: z.number(),
  completionDate: z.string(),
});

export const oneTimePaymentSchema = z.object({
  id: z.string(),
  type: z.literal('oneTimePayment'),
  name: z.string(),
  amount: z.number(),
  date: z.string(),
  status: z.enum(['pending', 'paid']),
});

export const savingsGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  createdAt: z.string(),
  linkedAccountId: z.string().optional(),
  priority: z.number(),
});

export const interestRateEntrySchema = z.object({
  rate: z.number(),
  date: z.string(),
  recurrence: z.enum(['daily', 'monthly', 'quarterly', 'yearly']),
  payoutDay: z.union([z.number(), z.literal('last')]),
});

export const savingsAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  interestHistory: z.array(interestRateEntrySchema),
});
