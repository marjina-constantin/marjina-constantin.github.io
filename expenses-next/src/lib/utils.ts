import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a date string from the API format (YYYY-MM-DD)
 * Returns a valid Date object or null if invalid
 */
export const parseApiDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Handle API date format: "2025-04-25"
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    if (!isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Fallback: try direct parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Format a date string from API format to display format
 * Returns formatted string or "Invalid Date" if parsing fails
 */
export const formatApiDate = (dateString: string, formatString: string = 'MMM dd, yyyy'): string => {
  const date = parseApiDate(dateString);
  if (!date) {
    return 'Invalid Date';
  }
  return format(date, formatString);
};

/**
 * Convert a date to API format (YYYY-MM-DD)
 */
export const toApiDateFormat = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
