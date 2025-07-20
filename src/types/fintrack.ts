
export interface Income {
  id: string;
  type: 'income';
  source: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
}

export interface Expense {
  id: string;
  type: 'expense';
  category: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
}

export interface RecurringPayment {
  id: string;
  type: 'payment';
  name: string;
  amount: number;
  startDate: string;
  numberOfPayments: number;
  completionDate: string; // This will be calculated and stored
}

export interface OneTimePayment {
  id:string;
  type: 'oneTimePayment';
  name: string;
  amount: number;
  dueDate: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense' | 'payment' | 'oneTimePayment';

export type AnyTransaction = Income | Expense | RecurringPayment | OneTimePayment;

export type ProfileData = {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  currentBalance: number;
  savingsGoals: SavingsGoal[];
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
