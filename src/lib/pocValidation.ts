import type { POC } from '@/types';

const INVALID_NAMES = [
  'run poc finder again',
  'error',
  'not found',
  'n/a',
  'null',
  'undefined',
  'unknown',
  'no data',
];

export const isValidPOC = (poc: POC): boolean => {
  if (!poc.name || poc.name.trim() === '') return false;

  const lower = poc.name.toLowerCase().trim();
  if (INVALID_NAMES.some(inv => lower.includes(inv))) return false;

  if (!poc.linkedin_url && !poc.title) return false;

  if (poc.linkedin_url && !poc.linkedin_url.includes('linkedin.com')) return false;

  return true;
};

export const getValidPocs = (pocs: POC[]): POC[] => pocs.filter(isValidPOC);
