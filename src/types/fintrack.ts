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
  rate: string;
  completionDate: string;
}

export type Transaction = Income | Expense | RecurringPayment;
