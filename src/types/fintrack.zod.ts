
import { z } from 'zod';

const id = z.string().uuid();

export const InstallmentDetailsSchema = z.object({
  numberOfPayments: z.number().int().positive(),
  completionDate: z.string(),
});

export const TransactionSchema = z.object({
    id,
    category: z.enum(['income', 'expense', 'payment']),
    recurrence: z.enum(['once', 'monthly', 'yearly']),
    name: z.string().min(2),
    amount: z.number().positive(),
    date: z.string(), // Further validation in form
    status: z.enum(['pending', 'paid']).optional(),
    installmentDetails: InstallmentDetailsSchema.optional(),
});


export const InterestRateEntrySchema = z.object({
  rate: z.number(),
  date: z.string(),
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
  createdAt: z.string(),
  linkedAccountId: z.string().optional(),
  priority: z.number().int(),
});

export const ProfileDataSchema = z.object({
  transactions: z.array(TransactionSchema).default([]),
  currentBalance: z.number(),
  savingsGoals: z.array(SavingsGoalSchema).default([]),
  savingsAccounts: z.array(SavingsAccountSchema).default([]),
}).refine(data => {
    // Legacy data migration
    if ('income' in data || 'expenses' in data) {
        return false; // Will trigger parsing error for old format, handled in import
    }
    return true;
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
