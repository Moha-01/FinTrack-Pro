import { Income, Expense, RecurringPayment } from '@/types/fintrack';

const toCSV = <T extends object>(data: T[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = (obj as any)[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

export const exportToCsv = (
  income: Income[],
  expenses: Expense[],
  payments: RecurringPayment[]
) => {
  const allData = {
    income: toCSV(income),
    expenses: toCSV(expenses),
    payments: toCSV(payments),
  };
  
  const zip = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zip);
  link.download = `fintrack-pro-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseImportedData = (
  fileContent: string
): { income: Income[]; expenses: Expense[]; payments: RecurringPayment[] } | null => {
  try {
    const data = JSON.parse(fileContent);
    const income = Array.isArray(data.income) ? data.income.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    const payments = Array.isArray(data.payments) ? data.payments.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [];
    return { income, expenses, payments };
  } catch (error) {
    console.error('Failed to parse imported data:', error);
    return null;
  }
};
