
import type { FullAppData } from '@/types/fintrack';
import { FullAppDataSchema } from '@/types/fintrack.zod';

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

export const parseAndValidateImportedJson = (
  fileContent: string
): FullAppData | null => {
  try {
    const data = JSON.parse(fileContent);
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
