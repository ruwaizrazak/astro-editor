import { vi } from 'vitest'
import { mockCollections, mockFiles, mockFileContent } from './test-utils'

// Mock for useCollectionsQuery
export const mockUseCollectionsQuery = vi.fn(() => ({
  data: mockCollections,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}))

// Mock for useCollectionFilesQuery
export const mockUseCollectionFilesQuery = vi.fn(() => ({
  data: mockFiles,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}))

// Mock for useFileContentQuery
export const mockUseFileContentQuery = vi.fn(() => ({
  data: mockFileContent,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}))

// Mock for useSaveFileMutation
export const mockUseSaveFileMutation = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null,
}))

// Mock for useCreateFileMutation
export const mockUseCreateFileMutation = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null,
}))

// Mock for useRenameFileMutation
export const mockUseRenameFileMutation = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null,
}))

// Mock for useDeleteFileMutation
export const mockUseDeleteFileMutation = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null,
}))
