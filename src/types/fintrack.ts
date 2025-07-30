export interface Income {
  id: string;
  type: 'income';
  source: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
  date: string; // Unified date field
}

export interface OneTimeIncome {
    id: string;
    type: 'oneTimeIncome';
    source: string;
    amount: number;
    date: string;
}

export interface Expense {
  id: string;
  type: 'expense';
  category: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
  date: string; // Unified date field (day of month for monthly, start date for yearly)
}

export interface RecurringPayment {
  id: string;
  type: 'payment';
  name: string;
  amount: number;
  date: string; // Replaces startDate
  numberOfPayments: number;
  completionDate: string; // This will be calculated and stored
}

export interface OneTimePayment {
  id:string;
  type: 'oneTimePayment';
  name: string;
  amount: number;
  date: string; // Replaces dueDate
  status: 'pending' | 'paid';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number; // For unlinked goals, manually tracked
  createdAt: string;
  linkedAccountId?: string; // ID of the linked SavingsAccount
  priority: number; // Lower number means higher priority
}

export type InterestRecurrence = 'daily' | 'monthly' | 'quarterly' | 'yearly';

export interface InterestRateEntry {
  rate: number;
  date: string; // ISO date string
  recurrence: InterestRecurrence;
  payoutDay: number | 'last';
}

export interface SavingsAccount {
  id: string;
  name: string;
  amount: number;
  interestHistory: InterestRateEntry[];
}

export type TransactionType = 'income' | 'oneTimeIncome' | 'expense' | 'payment' | 'oneTimePayment';

export type AnyTransaction = Income | OneTimeIncome | Expense | RecurringPayment | OneTimePayment;

export type FintrackView = 'dashboard' | 'transactions' | 'savings' | 'reports' | 'settings';

export type ProfileData = {
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  currentBalance: number;
  savingsGoals: SavingsGoal[];
  savingsAccounts: SavingsAccount[];
};

export type AppSettings = {
    language?: 'en' | 'de';
    currency?: 'EUR' | 'USD' | 'GBP';
    geminiApiKey?: string | null;
};

export type FullAppData = {
  activeProfile: string;
  profiles: string[];
  profileData: Record<string, ProfileData>;
  settings?: AppSettings;
};
