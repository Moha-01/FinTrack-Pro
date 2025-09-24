
import type { ProfileData } from '@/types/fintrack';
import { subMonths, addMonths, format, setDate } from 'date-fns';

const now = new Date();

export const demoProfileData: ProfileData = {
  currentBalance: 12345.67,
  transactions: [
    // Recurring Incomes
    {
      id: 'demo-income-1',
      category: 'income',
      recurrence: 'monthly',
      name: 'Gehalt',
      amount: 3500,
      date: format(setDate(now, 1), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-income-2',
      category: 'income',
      recurrence: 'monthly',
      name: 'Mieteinnahmen',
      amount: 450,
      date: format(setDate(now, 5), 'yyyy-MM-dd'),
    },
    // One-Time Incomes
    {
      id: 'demo-onetimeincome-1',
      category: 'income',
      recurrence: 'once',
      name: 'Freiberufliches Projekt',
      amount: 1200,
      date: format(subMonths(now, 1), 'yyyy-MM-dd'),
      status: 'paid',
    },
    // Recurring Expenses
    {
      id: 'demo-expense-1',
      category: 'expense',
      recurrence: 'monthly',
      name: 'Miete',
      amount: 950,
      date: format(setDate(now, 3), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-2',
      category: 'expense',
      recurrence: 'monthly',
      name: 'Lebensmittel',
      amount: 400,
      date: format(setDate(now, 10), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-3',
      category: 'expense',
      recurrence: 'monthly',
      name: 'Versicherungen',
      amount: 150,
      date: format(setDate(now, 15), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-4',
      category: 'expense',
      recurrence: 'yearly',
      name: 'Rundfunkbeitrag',
      amount: 55.08,
      date: format(new Date(now.getFullYear(), 0, 15), 'yyyy-MM-dd'),
    },
    // Recurring Payments (Installments)
    {
      id: 'demo-payment-1',
      category: 'payment',
      recurrence: 'monthly',
      name: 'Autokredit',
      amount: 350,
      date: format(subMonths(now, 6), 'yyyy-MM-dd'),
      installmentDetails: {
        numberOfPayments: 24,
        completionDate: format(addMonths(subMonths(now, 6), 24), 'yyyy-MM-dd'),
      },
    },
    {
      id: 'demo-payment-2',
      category: 'payment',
      recurrence: 'monthly',
      name: 'Handyvertrag',
      amount: 40,
      date: format(subMonths(now, 2), 'yyyy-MM-dd'),
      installmentDetails: {
        numberOfPayments: 12,
        completionDate: format(addMonths(subMonths(now, 2), 12), 'yyyy-MM-dd'),
      },
    },
    // One-Time Payments
    {
      id: 'demo-onetime-1',
      category: 'payment',
      recurrence: 'once',
      name: 'Stromnachzahlung',
      amount: 120,
      date: format(addMonths(now, 1), 'yyyy-MM-dd'),
      status: 'pending',
    },
    {
      id: 'demo-onetime-2',
      category: 'payment',
      recurrence: 'once',
      name: 'Konzertkarten',
      amount: 85,
      date: format(subMonths(now, 1), 'yyyy-MM-dd'),
      status: 'paid',
    },
  ],
  savingsAccounts: [
    {
      id: 'demo-savings-account-1',
      name: 'Tagesgeldkonto',
      amount: 8500,
      interestHistory: [
        { rate: 3.5, date: format(subMonths(now, 6), 'yyyy-MM-dd'), recurrence: 'monthly', payoutDay: 'last' },
      ],
    },
    {
      id: 'demo-savings-account-2',
      name: 'Bargeld',
      amount: 500,
      interestHistory: [],
    },
  ],
  savingsGoals: [
    {
      id: 'demo-goal-1',
      name: 'Traumurlaub Japan',
      targetAmount: 5000,
      currentAmount: 0,
      createdAt: format(subMonths(now, 3), 'yyyy-MM-dd'),
      linkedAccountId: 'demo-savings-account-1',
      priority: 0,
    },
    {
      id: 'demo-goal-2',
      name: 'Neues MacBook',
      targetAmount: 2500,
      currentAmount: 0,
      createdAt: format(subMonths(now, 1), 'yyyy-MM-dd'),
      linkedAccountId: 'demo-savings-account-1',
      priority: 1,
    },
    {
      id: 'demo-goal-3',
      name: 'Notgroschen',
      targetAmount: 10000,
      currentAmount: 8500,
      createdAt: format(subMonths(now, 12), 'yyyy-MM-dd'),
      linkedAccountId: undefined,
      priority: 2,
    },
  ],
};
