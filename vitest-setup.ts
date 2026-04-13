import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for idb-keyval so Zustand persist doesn't crash in node
const mockIdb = {};
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key) => mockIdb[key]),
  set: vi.fn(async (key, val) => { mockIdb[key] = val; }),
  del: vi.fn(async (key) => { delete mockIdb[key]; }),
}));
