/**
 * Project registry persistence layer
 *
 * Handles saving and loading project data using the application support directory
 */

import { invoke } from '@tauri-apps/api/core'
import { error } from '@tauri-apps/plugin-log'
import { ProjectRegistry, GlobalSettings, ProjectData } from './types'
import { DEFAULT_PROJECT_REGISTRY, DEFAULT_GLOBAL_SETTINGS } from './defaults'

/**
 * Get the application support directory paths
 */
async function getAppSupportPaths() {
  const appDataDir = await invoke<string>('get_app_data_dir')
  return {
    preferencesDir: `${appDataDir}/preferences`,
    projectsDir: `${appDataDir}/preferences/projects`,
    globalSettingsPath: `${appDataDir}/preferences/global-settings.json`,
    projectRegistryPath: `${appDataDir}/preferences/project-registry.json`,
  }
}

/**
 * Ensure preferences directory exists
 */
async function ensurePreferencesDir() {
  const { preferencesDir, projectsDir } = await getAppSupportPaths()

  try {
    await invoke('create_directory', { path: preferencesDir })
    await invoke('create_directory', { path: projectsDir })
  } catch {
    // Directories might already exist, that's fine
  }
}

/**
 * Load the project registry from disk
 */
export async function loadProjectRegistry(): Promise<ProjectRegistry> {
  try {
    const { projectRegistryPath } = await getAppSupportPaths()
    const content = await invoke<string>('read_app_data_file', {
      filePath: projectRegistryPath,
    })

    const registry = JSON.parse(content) as ProjectRegistry

    // Validate and migrate if needed
    const finalRegistry = {
      ...DEFAULT_PROJECT_REGISTRY,
      ...registry,
      version: registry.version || 1,
    }
    return finalRegistry
  } catch {
    // File doesn't exist or is invalid, return defaults
    return { ...DEFAULT_PROJECT_REGISTRY }
  }
}

/**
 * Save the project registry to disk
 */
export async function saveProjectRegistry(
  registry: ProjectRegistry
): Promise<void> {
  try {
    await ensurePreferencesDir()
    const { projectRegistryPath } = await getAppSupportPaths()

    await invoke('write_app_data_file', {
      filePath: projectRegistryPath,
      content: JSON.stringify(registry, null, 2),
    })
  } catch (err) {
    await error(`Failed to save project registry: ${String(err)}`)
    throw err
  }
}

/**
 * Load global settings from disk
 */
export async function loadGlobalSettings(): Promise<GlobalSettings> {
  try {
    const { globalSettingsPath } = await getAppSupportPaths()
    const content = await invoke<string>('read_app_data_file', {
      filePath: globalSettingsPath,
    })

    const settings = JSON.parse(content) as GlobalSettings

    // Validate and migrate if needed - deep merge to preserve nested objects
    return {
      ...DEFAULT_GLOBAL_SETTINGS,
      ...settings,
      general: {
        ...DEFAULT_GLOBAL_SETTINGS.general,
        ...(settings.general || {}),
      },
      defaultProjectSettings: {
        ...DEFAULT_GLOBAL_SETTINGS.defaultProjectSettings,
        ...(settings.defaultProjectSettings || {}),
        pathOverrides: {
          ...DEFAULT_GLOBAL_SETTINGS.defaultProjectSettings.pathOverrides,
          ...(settings.defaultProjectSettings?.pathOverrides || {}),
        },
        frontmatterMappings: {
          ...DEFAULT_GLOBAL_SETTINGS.defaultProjectSettings.frontmatterMappings,
          ...(settings.defaultProjectSettings?.frontmatterMappings || {}),
        },
      },
      version: settings.version || DEFAULT_GLOBAL_SETTINGS.version,
    }
  } catch {
    // File doesn't exist or is invalid, return defaults
    // Deep clone to ensure nested objects are preserved
    return JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS)) as GlobalSettings
  }
}

/**
 * Save global settings to disk
 */
export async function saveGlobalSettings(
  settings: GlobalSettings
): Promise<void> {
  try {
    await ensurePreferencesDir()
    const { globalSettingsPath } = await getAppSupportPaths()

    await invoke('write_app_data_file', {
      filePath: globalSettingsPath,
      content: JSON.stringify(settings, null, 2),
    })
  } catch (err) {
    await error(`Failed to save global settings: ${String(err)}`)
    throw err
  }
}

/**
 * Load project-specific data from disk
 */
export async function loadProjectData(
  projectId: string
): Promise<ProjectData | null> {
  try {
    const { projectsDir } = await getAppSupportPaths()
    const projectFilePath = `${projectsDir}/${projectId}.json`

    const content = await invoke<string>('read_app_data_file', {
      filePath: projectFilePath,
    })

    return JSON.parse(content) as ProjectData
  } catch {
    // File doesn't exist or is invalid
    return null
  }
}

/**
 * Save project-specific data to disk
 */
export async function saveProjectData(
  projectId: string,
  data: ProjectData
): Promise<void> {
  try {
    await ensurePreferencesDir()
    const { projectsDir } = await getAppSupportPaths()
    const projectFilePath = `${projectsDir}/${projectId}.json`

    await invoke('write_app_data_file', {
      filePath: projectFilePath,
      content: JSON.stringify(data, null, 2),
    })
  } catch (err) {
    await error(`Failed to save project data: ${String(err)}`)
    throw err
  }
}
