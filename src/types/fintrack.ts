
export type TransactionCategory = 'income' | 'expense' | 'payment';
export type TransactionRecurrence = 'once' | 'monthly' | 'yearly';

export interface InstallmentDetails {
  numberOfPayments: number;
  completionDate: string; // This will be calculated and stored
}

export interface Transaction {
  id: string;
  category: TransactionCategory;
  recurrence: TransactionRecurrence;
  name: string; // Replaces source/category/name fields
  amount: number;
  date: string; // Start date for recurring, due date for one-time
  status?: 'pending' | 'paid'; // Only for one-time payments
  installmentDetails?: InstallmentDetails;
}


export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  linkedAccountId?: string;
  priority: number;
}

export type InterestRecurrence = 'daily' | 'monthly' | 'quarterly' | 'yearly';

export interface InterestRateEntry {
  rate: number;
  date: string;
  recurrence: InterestRecurrence;
  payoutDay: number | 'last';
}

export interface SavingsAccount {
  id: string;
  name: string;
  amount: number;
  interestHistory: InterestRateEntry[];
}

export type AnyTransaction = Transaction;
export type TransactionType = 'income' | 'oneTimeIncome' | 'expense' | 'payment' | 'oneTimePayment'; // Kept for toast messages, might be refactored later
export type FintrackView = 'dashboard' | 'transactions' | 'savings' | 'reports' | 'settings' | 'about';

export type ProfileData = {
  transactions: Transaction[];
  currentBalance: number;
  savingsGoals: SavingsGoal[];
  savingsAccounts: SavingsAccount[];
};

export type AppSettings = {
    language: 'en' | 'de' | 'ar';
    currency: 'EUR' | 'USD' | 'GBP';
    geminiApiKey: string | null;
};

export type FullAppData = {
  activeProfile: string;
  profiles: string[];
  profileData: Record<string, ProfileData>;
  settings: AppSettings;
};
