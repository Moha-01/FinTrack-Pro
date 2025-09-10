
import type { ProfileData } from '@/types/fintrack';
import { subMonths, addMonths, format, setDate } from 'date-fns';

const now = new Date();

export const demoProfileData: ProfileData = {
  currentBalance: 12345.67,
  income: [
    {
      id: 'demo-income-1',
      type: 'income',
      source: 'Gehalt',
      amount: 3500,
      recurrence: 'monthly',
      date: format(setDate(now, 1), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-income-2',
      type: 'income',
      source: 'Mieteinnahmen',
      amount: 450,
      recurrence: 'monthly',
      date: format(setDate(now, 5), 'yyyy-MM-dd'),
    },
  ],
  oneTimeIncomes: [
      {
        id: 'demo-onetimeincome-1',
        type: 'oneTimeIncome',
        source: 'Freiberufliches Projekt',
        amount: 1200,
        date: format(subMonths(now, 1), 'yyyy-MM-dd'),
      },
  ],
  expenses: [
    {
      id: 'demo-expense-1',
      type: 'expense',
      category: 'Miete',
      amount: 950,
      recurrence: 'monthly',
      date: format(setDate(now, 3), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-2',
      type: 'expense',
      category: 'Lebensmittel',
      amount: 400,
      recurrence: 'monthly',
      date: format(setDate(now, 10), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-3',
      type: 'expense',
      category: 'Versicherungen',
      amount: 150,
      recurrence: 'monthly',
      date: format(setDate(now, 15), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-expense-4',
      type: 'expense',
      category: 'Rundfunkbeitrag',
      amount: 55.08,
      recurrence: 'yearly',
      date: format(new Date(now.getFullYear(), 0, 15), 'yyyy-MM-dd'),
    },
  ],
  payments: [
    {
      id: 'demo-payment-1',
      type: 'payment',
      name: 'Autokredit',
      amount: 350,
      date: format(subMonths(now, 6), 'yyyy-MM-dd'),
      numberOfPayments: 24,
      completionDate: format(addMonths(subMonths(now, 6), 24), 'yyyy-MM-dd'),
    },
    {
      id: 'demo-payment-2',
      type: 'payment',
      name: 'Handyvertrag',
      amount: 40,
      date: format(subMonths(now, 2), 'yyyy-MM-dd'),
      numberOfPayments: 12,
      completionDate: format(addMonths(subMonths(now, 2), 12), 'yyyy-MM-dd'),
    },
  ],
  oneTimePayments: [
    {
      id: 'demo-onetime-1',
      type: 'oneTimePayment',
      name: 'Stromnachzahlung',
      amount: 120,
      date: format(addMonths(now, 1), 'yyyy-MM-dd'),
      status: 'pending',
    },
    {
      id: 'demo-onetime-2',
      type: 'oneTimePayment',
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
      currentAmount: 0, // Linked, so current amount is calculated
      createdAt: format(subMonths(now, 3), 'yyyy-MM-dd'),
      linkedAccountId: 'demo-savings-account-1',
      priority: 0,
    },
    {
      id: 'demo-goal-2',
      name: 'Neues MacBook',
      targetAmount: 2500,
      currentAmount: 0, // Linked, so current amount is calculated
      createdAt: format(subMonths(now, 1), 'yyyy-MM-dd'),
      linkedAccountId: 'demo-savings-account-1',
      priority: 1,
    },
    {
      id: 'demo-goal-3',
      name: 'Notgroschen',
      targetAmount: 10000,
      currentAmount: 8500, // Manually tracked
      createdAt: format(subMonths(now, 12), 'yyyy-MM-dd'),
      linkedAccountId: undefined,
      priority: 2,
    },
  ],
};
