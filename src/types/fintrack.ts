
export interface Income {
  id: string;
  source: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  recurrence: 'monthly' | 'yearly';
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  numberOfPayments: number;
  completionDate: string; // This will be calculated and stored
}

export interface OneTimePayment {
  id:string;
  name: string;
  amount: number;
  dueDate: string;
}

export type TransactionType = 'income' | 'expense' | 'payment' | 'oneTimePayment';

export type Transaction = (Income & {type: 'income'}) 
  | (Expense & {type: 'expense'}) 
  | (RecurringPayment & {type: 'payment'}) 
  | (OneTimePayment & {type: 'oneTimePayment'});

export type AnyTransaction = (Income | Expense | RecurringPayment | OneTimePayment) & { type: TransactionType };


export type ProfileData = {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  currentBalance: number;
};

export type FullAppData = {
  activeProfile: string;
  profiles: string[];
  profileData: Record<string, ProfileData>;
};
