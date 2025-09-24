
import type { FullAppData, ProfileData, Transaction } from '@/types/fintrack';
import { FullAppDataSchema, ProfileDataSchema } from '@/types/fintrack.zod';

export const exportToJson = (data: FullAppData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fintrack-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to migrate old data structure to the new one
const migrateProfileData = (oldData: any): ProfileData => {
    const transactions: Transaction[] = [];

    (oldData.income || []).forEach((i: any) => transactions.push({
        id: i.id,
        category: 'income',
        recurrence: i.recurrence,
        name: i.source,
        amount: i.amount,
        date: i.date,
    }));
    (oldData.oneTimeIncomes || []).forEach((i: any) => transactions.push({
        id: i.id,
        category: 'income',
        recurrence: 'once',
        name: i.source,
        amount: i.amount,
        date: i.date,
        status: 'paid', // Assume old one-time incomes were 'paid'
    }));
    (oldData.expenses || []).forEach((e: any) => transactions.push({
        id: e.id,
        category: 'expense',
        recurrence: e.recurrence,
        name: e.category,
        amount: e.amount,
        date: e.date,
    }));
    (oldData.payments || []).forEach((p: any) => transactions.push({
        id: p.id,
        category: 'payment',
        recurrence: 'monthly', // old payments were always monthly installments
        name: p.name,
        amount: p.amount,
        date: p.date,
        installmentDetails: {
            numberOfPayments: p.numberOfPayments,
            completionDate: p.completionDate,
        }
    }));
    (oldData.oneTimePayments || []).forEach((p: any) => transactions.push({
        id: p.id,
        category: 'payment',
        recurrence: 'once',
        name: p.name,
        amount: p.amount,
        date: p.date,
        status: p.status,
    }));

    return {
        transactions,
        currentBalance: oldData.currentBalance,
        savingsGoals: oldData.savingsGoals || [],
        savingsAccounts: oldData.savingsAccounts || [],
    };
}


export const parseAndValidateImportedJson = (
  fileContent: string
): FullAppData | null => {
  try {
    let data = JSON.parse(fileContent);
    
    // Check if this is the old data structure and migrate if necessary
    const isOldStructure = Object.values(data.profileData).some((d: any) => 'income' in d || 'expenses' in d);
    if (isOldStructure) {
        Object.keys(data.profileData).forEach(key => {
            data.profileData[key] = migrateProfileData(data.profileData[key]);
        });
    }

    const validationResult = FullAppDataSchema.safeParse(data);

    if (validationResult.success) {
      return validationResult.data;
    } else {
      console.error('Failed to validate imported JSON data:', validationResult.error.flatten());
      return null;
    }
  } catch (error) {
    console.error('Failed to parse imported JSON file:', error);
    return null;
  }
};
