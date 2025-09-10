
export interface Income {
  id: string;
  type: 'income';
  source: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
  date: string;
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
  date: string;
}

export interface RecurringPayment {
  id: string;
  type: 'payment';
  name: string;
  amount: number;
  date: string;
  numberOfPayments: number;
  completionDate: string; // This will be calculated and stored
}

export interface OneTimePayment {
  id:string;
  type: 'oneTimePayment';
  name: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
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
