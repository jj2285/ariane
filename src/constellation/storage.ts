import type { ConstellationData } from './types';
import { DEFAULT_DATA } from './defaultData';

const KEY = 'lpe_constellation_data';

export function loadData(): ConstellationData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ConstellationData;
  } catch {
    // fall through
  }
  return structuredClone(DEFAULT_DATA);
}

export function saveData(data: ConstellationData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function resetData(): ConstellationData {
  localStorage.removeItem(KEY);
  return structuredClone(DEFAULT_DATA);
}

const INTRO_KEY = 'lpe_constellation_intro_done';

export function isIntroDone(): boolean {
  return localStorage.getItem(INTRO_KEY) === '1';
}

export function markIntroDone(): void {
  localStorage.setItem(INTRO_KEY, '1');
}
