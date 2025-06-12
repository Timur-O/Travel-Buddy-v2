import { CountryImportData } from 'src/models';

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export function validateCountryJson(jsonInput: string): ValidationResult {
  const trimmedInput = jsonInput.trim();
  if (!trimmedInput) {
    return {
      isValid: false,
      message: 'Please enter JSON data',
    };
  }

  try {
    const parsed: CountryImportData[] = JSON.parse(trimmedInput);
    if (!Array.isArray(parsed)) {
      return {
        isValid: false,
        message: 'Input must be an array of country objects',
      };
    }

    const requiredFields: (keyof CountryImportData)[] = [
      'id',
      'name',
      'flag',
      'region',
      'sovereignty',
    ];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      for (const field of requiredFields) {
        if (!item[field]) {
          return {
            isValid: false,
            message:
              field === 'id' || field === 'name'
                ? `Country at index ${i} is missing '${field}' field`
                : `Country '${item.name}' is missing '${field}' field`,
          };
        }
      }
    }

    return {
      isValid: true,
      message: `Valid JSON format with ${parsed.length} countries`,
    };
  } catch (e) {
    return {
      isValid: false,
      message:
        'Invalid JSON syntax: Please check for missing commas, brackets, or quotes',
    };
  }
}
