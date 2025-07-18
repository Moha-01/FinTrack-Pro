import type { FullAppData, ProfileData } from '@/types/fintrack';

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

export const parseImportedJson = (
  fileContent: string
): FullAppData | null => {
  try {
    const data = JSON.parse(fileContent);

    // Basic validation to ensure the imported data has the expected structure
    const profiles = Array.isArray(data.profiles) && data.profiles.every((p: any) => typeof p === 'string') ? data.profiles : null;
    const activeProfile = typeof data.activeProfile === 'string' && profiles?.includes(data.activeProfile) ? data.activeProfile : null;
    const profileData = typeof data.profileData === 'object' && data.profileData !== null ? data.profileData : null;

    if (!profiles || !activeProfile || !profileData) {
      console.error('Invalid import format: missing or malformed profiles, activeProfile, or profileData.');
      return null;
    }

    // Deep validation and sanitization of each profile's data
    for (const profileName of profiles) {
      if (!profileData[profileName]) {
        console.error(`Invalid import format: data for profile "${profileName}" is missing.`);
        return null;
      }
      const pData = profileData[profileName];
      const validatedData: ProfileData = {
          income: Array.isArray(pData.income) ? pData.income.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [],
          expenses: Array.isArray(pData.expenses) ? pData.expenses.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [],
          payments: Array.isArray(pData.payments || pData.recurringPayments) ? (pData.payments || pData.recurringPayments).map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [],
          oneTimePayments: Array.isArray(pData.oneTimePayments) ? pData.oneTimePayments.map((item: any) => ({...item, id: item.id || crypto.randomUUID()})) : [],
          currentBalance: typeof pData.currentBalance === 'number' ? pData.currentBalance : 0,
      };
       profileData[profileName] = validatedData;
    }

    return { profiles, activeProfile, profileData };
  } catch (error) {
    console.error('Failed to parse imported JSON data:', error);
    return null;
  }
};
