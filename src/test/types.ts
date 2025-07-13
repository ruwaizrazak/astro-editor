import { vi } from 'vitest';

declare global {
  var mockTauri: {
    invoke: ReturnType<typeof vi.fn>;
    listen: ReturnType<typeof vi.fn>;
    reset: () => void;
  };
}
