import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API calls for testing
const mockInvoke = vi.fn();
const mockListen = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
}));

// Make mocks available globally for tests
globalThis.mockTauri = {
  invoke: mockInvoke,
  listen: mockListen,
  reset: () => {
    mockInvoke.mockReset();
    mockListen.mockReset();
  },
};
