
import { z } from 'zod';

const id = z.string().uuid();

export const IncomeSchema = z.object({
  id,
  type: z.literal('income'),
  source: z.string().min(2),
  amount: z.number().positive(),
  recurrence: z.enum(['monthly', 'yearly']),
  date: z.string().datetime(),
});

export const OneTimeIncomeSchema = z.object({
  id,
  type: z.literal('oneTimeIncome'),
  source: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().datetime(),
});

export const ExpenseSchema = z.object({
  id,
  type: z.literal('expense'),
  category: z.string().min(2),
  amount: z.number().positive(),
  recurrence: z.enum(['monthly', 'yearly']),
  date: z.string().datetime(),
});

export const RecurringPaymentSchema = z.object({
  id,
  type: z.literal('payment'),
  name: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().datetime(),
  numberOfPayments: z.number().int().positive(),
  completionDate: z.string().datetime(),
});

export const OneTimePaymentSchema = z.object({
  id,
  type: z.literal('oneTimePayment'),
  name: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().datetime(),
  status: z.enum(['pending', 'paid']),
});

export const InterestRateEntrySchema = z.object({
  rate: z.number(),
  date: z.string().datetime(),
  recurrence: z.enum(['daily', 'monthly', 'quarterly', 'yearly']),
  payoutDay: z.union([z.number().int().min(1).max(31), z.literal('last')]),
});

export const SavingsAccountSchema = z.object({
  id,
  name: z.string().min(2),
  amount: z.number(),
  interestHistory: z.array(InterestRateEntrySchema),
});

export const SavingsGoalSchema = z.object({
  id,
  name: z.string().min(2),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  linkedAccountId: z.string().optional(),
  priority: z.number().int(),
});

export const ProfileDataSchema = z.object({
  income: z.array(IncomeSchema),
  oneTimeIncomes: z.array(OneTimeIncomeSchema),
  expenses: z.array(ExpenseSchema),
  payments: z.array(RecurringPaymentSchema),
  oneTimePayments: z.array(OneTimePaymentSchema),
  currentBalance: z.number(),
  savingsGoals: z.array(SavingsGoalSchema),
  savingsAccounts: z.array(SavingsAccountSchema),
});

export const AppSettingsSchema = z.object({
  language: z.enum(['en', 'de', 'ar']),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  geminiApiKey: z.string().nullable(),
});

export const FullAppDataSchema = z.object({
  activeProfile: z.string(),
  profiles: z.array(z.string()),
  profileData: z.record(ProfileDataSchema),
  settings: AppSettingsSchema,
});
