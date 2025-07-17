/**
 * Basic tests for the project registry system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectRegistryManager } from '../lib/project-registry'
import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_PROJECT_SETTINGS,
} from '../lib/project-registry/defaults'

// Mock Tauri invoke for testing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Project Registry System', () => {
  let manager: ProjectRegistryManager
  let mockInvoke: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Import the mocked invoke function
    const { invoke } = await import('@tauri-apps/api/core')
    mockInvoke = invoke as ReturnType<typeof vi.fn>

    manager = new ProjectRegistryManager()
    mockInvoke.mockClear()
  })

  it('should initialize with default settings', async () => {
    // Mock the file system calls to return default data
    mockInvoke.mockResolvedValueOnce('/mock/app/data') // get_app_data_dir
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (registry)
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (global settings)

    await manager.initialize()

    const globalSettings = manager.getGlobalSettings()
    const registry = manager.getRegistry()

    expect(globalSettings).toEqual(DEFAULT_GLOBAL_SETTINGS)
    expect(registry.projects).toEqual({})
    expect(registry.lastOpenedProject).toBeNull()
  })

  it('should handle project registration', async () => {
    // Initialize manager first
    mockInvoke.mockResolvedValueOnce('/mock/app/data') // get_app_data_dir
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (registry)
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (global settings)

    await manager.initialize()

    // Mock project discovery
    const mockProjectPath = '/mock/project/path'
    const mockPackageJson = JSON.stringify({ name: 'test-project' })

    mockInvoke.mockResolvedValueOnce(mockPackageJson) // read_file_content (package.json)
    mockInvoke.mockResolvedValueOnce(undefined) // write_file_content (save registry)

    const projectId = await manager.registerProject(mockProjectPath)

    expect(projectId).toBe('test-project')
    expect(manager.getRegistry().projects[projectId]).toBeDefined()
    expect(manager.getRegistry().lastOpenedProject).toBe(projectId)
  })

  it('should provide effective settings combining global and project settings', async () => {
    // Initialize manager
    mockInvoke.mockResolvedValueOnce('/mock/app/data') // get_app_data_dir
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (registry)
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (global settings)

    await manager.initialize()

    // Register a project
    const mockProjectPath = '/mock/project/path'
    const mockPackageJson = JSON.stringify({ name: 'test-project' })

    mockInvoke.mockResolvedValueOnce(mockPackageJson) // read_file_content (package.json)
    mockInvoke.mockResolvedValueOnce(undefined) // write_file_content (save registry)

    const projectId = await manager.registerProject(mockProjectPath)

    // Mock loading project data (no project-specific settings)
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (project data)
    mockInvoke.mockResolvedValueOnce(undefined) // write_file_content (save project data)

    const effectiveSettings = await manager.getEffectiveSettings(projectId)

    // Should return default settings since no project-specific overrides
    expect(effectiveSettings).toEqual(DEFAULT_PROJECT_SETTINGS)
  })

  it('should handle project path migration', async () => {
    // Initialize manager
    mockInvoke.mockResolvedValueOnce('/mock/app/data') // get_app_data_dir
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (registry)
    mockInvoke.mockRejectedValueOnce(new Error('File not found')) // read_file_content (global settings)

    await manager.initialize()

    // Register a project at original path
    const originalPath = '/original/project/path'
    const mockPackageJson = JSON.stringify({ name: 'test-project' })

    mockInvoke.mockResolvedValueOnce(mockPackageJson) // read_file_content (package.json)
    mockInvoke.mockResolvedValueOnce(undefined) // write_file_content (save registry)

    const projectId = await manager.registerProject(originalPath)

    // Now try to register same project at new path
    const newPath = '/new/project/path'
    mockInvoke.mockResolvedValueOnce(mockPackageJson) // read_file_content (package.json) - same project
    mockInvoke.mockResolvedValueOnce(undefined) // write_file_content (save registry)

    const newProjectId = await manager.registerProject(newPath)

    // Should be the same project ID
    expect(newProjectId).toBe(projectId)

    // Path should be updated
    const registry = manager.getRegistry()
    expect(registry.projects[projectId]?.path).toBe(newPath)
  })
})
