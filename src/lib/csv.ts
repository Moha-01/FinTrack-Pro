import { Income, Expense, RecurringPayment, OneTimePayment } from '@/types/fintrack';

type AllData = {
  income: Income[],
  expenses: Expense[],
  recurringPayments: RecurringPayment[],
  oneTimePayments: OneTimePayment[],
  currentBalance: number
}

export const exportToCsv = (data: AllData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fintrack-pro-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseImportedData = (
  fileContent: string
): AllData | null => {
  try {
    const data = JSON.parse(fileContent);
    const income = Array.isArray(data.income) ? data.income.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const recurringPayments = Array.isArray(data.recurringPayments) ? data.recurringPayments.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const oneTimePayments = Array.isArray(data.oneTimePayments) ? data.oneTimePayments.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const currentBalance = typeof data.currentBalance === 'number' ? data.currentBalance : 0;
    
    return { income, expenses, recurringPayments, oneTimePayments, currentBalance };
  } catch (error) {
    console.error('Failed to parse imported data:', error);
    return null;
  }
};
