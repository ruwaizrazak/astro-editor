// DEPRECATED: This test was for the monolithic useAppStore which has been decomposed
// into useEditorStore, useProjectStore, and useUIStore.
//
// Individual store tests should be created for the new stores.
// This file is kept for reference but tests are skipped.

import { describe, it } from 'vitest'

describe.skip('App Store (DEPRECATED)', () => {
  it('has been decomposed into multiple stores', () => {
    // Tests for the old monolithic store are no longer relevant
    // Use:
    // - useEditorStore for file editing state
    // - useProjectStore for project-level state
    // - useUIStore for UI layout state
  })
})
