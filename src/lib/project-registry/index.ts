/**
 * Project Registry System
 *
 * Main API for managing project identification, settings, and persistence
 */

import {
  ProjectRegistry,
  GlobalSettings,
  ProjectData,
  ProjectMetadata,
  ProjectSettings,
} from './types'
import {
  loadProjectRegistry,
  saveProjectRegistry,
  loadGlobalSettings,
  saveGlobalSettings,
  loadProjectData,
  saveProjectData,
} from './persistence'
import { discoverProject, isSameProject } from './utils'
import { DEFAULT_PROJECT_SETTINGS } from './defaults'

export class ProjectRegistryManager {
  private registry: ProjectRegistry | null = null
  private globalSettings: GlobalSettings | null = null
  private projectDataCache: Map<string, ProjectData> = new Map()

  /**
   * Initialize the registry manager
   */
  async initialize(): Promise<void> {
    this.registry = await loadProjectRegistry()
    this.globalSettings = await loadGlobalSettings()
  }

  /**
   * Get the current project registry
   */
  getRegistry(): ProjectRegistry {
    if (!this.registry) {
      throw new Error('Registry not initialized')
    }
    return this.registry
  }

  /**
   * Get global settings
   */
  getGlobalSettings(): GlobalSettings {
    if (!this.globalSettings) {
      throw new Error('Global settings not initialized')
    }
    return this.globalSettings
  }

  /**
   * Register a new project or update existing one
   */
  async registerProject(projectPath: string): Promise<string> {
    if (!this.registry) {
      throw new Error('Registry not initialized')
    }

    const existingIds = new Set(Object.keys(this.registry.projects))

    // Check if this project already exists (by path)
    const existingProject = Object.values(this.registry.projects).find(
      p => p.path === projectPath
    )
    if (existingProject) {
      // Update last opened time
      existingProject.lastOpened = new Date().toISOString()
      this.registry.lastOpenedProject = existingProject.id
      await saveProjectRegistry(this.registry)
      return existingProject.id
    }

    // Check if this is a moved project
    const movedProject = await this.findMovedProject(projectPath)
    if (movedProject) {
      // Update the path
      movedProject.path = projectPath
      movedProject.lastOpened = new Date().toISOString()
      this.registry.lastOpenedProject = movedProject.id
      await saveProjectRegistry(this.registry)
      return movedProject.id
    }

    // Discover new project
    const projectMetadata = await discoverProject(projectPath, existingIds)

    // Add to registry
    this.registry.projects[projectMetadata.id] = projectMetadata
    this.registry.lastOpenedProject = projectMetadata.id

    // Save registry
    await saveProjectRegistry(this.registry)

    return projectMetadata.id
  }

  /**
   * Find a project that may have been moved
   */
  private async findMovedProject(
    newPath: string
  ): Promise<ProjectMetadata | null> {
    if (!this.registry) return null

    for (const project of Object.values(this.registry.projects)) {
      if (await isSameProject(project, newPath)) {
        return project
      }
    }
    return null
  }

  /**
   * Get project data (metadata + settings)
   */
  async getProjectData(projectId: string): Promise<ProjectData | null> {
    if (!this.registry) {
      throw new Error('Registry not initialized')
    }

    // Check cache first
    if (this.projectDataCache.has(projectId)) {
      return this.projectDataCache.get(projectId)!
    }

    const metadata = this.registry.projects[projectId]
    if (!metadata) {
      return null
    }

    // Load project-specific data
    const projectData = await loadProjectData(projectId)

    if (projectData) {
      // Cache and return
      this.projectDataCache.set(projectId, projectData)
      return projectData
    }

    // Create default project data
    const defaultData: ProjectData = {
      metadata,
      settings: { ...DEFAULT_PROJECT_SETTINGS },
    }

    // Cache and save
    this.projectDataCache.set(projectId, defaultData)
    await saveProjectData(projectId, defaultData)

    return defaultData
  }

  /**
   * Update project settings
   */
  async updateProjectSettings(
    projectId: string,
    settings: Partial<ProjectSettings>
  ): Promise<void> {
    const projectData = await this.getProjectData(projectId)
    if (!projectData) {
      throw new Error(`Project ${projectId} not found`)
    }

    // Update settings
    projectData.settings = {
      ...projectData.settings,
      pathOverrides: {
        ...projectData.settings.pathOverrides,
        ...settings.pathOverrides,
      },
      frontmatterMappings: {
        ...projectData.settings.frontmatterMappings,
        ...settings.frontmatterMappings,
      },
    }

    // Update cache
    this.projectDataCache.set(projectId, projectData)

    // Save to disk
    await saveProjectData(projectId, projectData)
  }

  /**
   * Update global settings
   */
  async updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<void> {
    if (!this.globalSettings) {
      throw new Error('Global settings not initialized')
    }

    this.globalSettings = {
      ...this.globalSettings,
      ...settings,
      general: {
        ...this.globalSettings.general,
        ...settings.general,
      },
      defaultProjectSettings: {
        ...this.globalSettings.defaultProjectSettings,
        ...settings.defaultProjectSettings,
      },
    }

    await saveGlobalSettings(this.globalSettings)
  }

  /**
   * Get effective settings for a project (global defaults + project overrides)
   */
  async getEffectiveSettings(projectId: string): Promise<ProjectSettings> {
    const projectData = await this.getProjectData(projectId)
    const globalSettings = this.getGlobalSettings()

    if (!projectData) {
      return { ...globalSettings.defaultProjectSettings }
    }

    return {
      pathOverrides: {
        ...globalSettings.defaultProjectSettings.pathOverrides,
        ...projectData.settings.pathOverrides,
      },
      frontmatterMappings: {
        ...globalSettings.defaultProjectSettings.frontmatterMappings,
        ...projectData.settings.frontmatterMappings,
      },
    }
  }

  /**
   * Get the last opened project ID
   */
  getLastOpenedProjectId(): string | null {
    return this.registry?.lastOpenedProject || null
  }

  /**
   * Clear cache for a project (useful for testing)
   */
  clearProjectCache(projectId: string): void {
    this.projectDataCache.delete(projectId)
  }
}

// Export the manager instance
export const projectRegistryManager = new ProjectRegistryManager()

// Export types and utilities
export * from './types'
export * from './defaults'
