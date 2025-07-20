import { useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { GlobalSettings, ProjectSettings } from '../lib/project-registry'

/**
 * Custom hook for managing preferences with easy read/write access
 */
export const usePreferences = () => {
  const {
    globalSettings,
    currentProjectSettings,
    updateGlobalSettings,
    updateProjectSettings,
    currentProjectId,
    projectPath,
  } = useProjectStore()

  const updateGlobal = useCallback(
    (settings: Partial<GlobalSettings>) => {
      return updateGlobalSettings(settings)
    },
    [updateGlobalSettings]
  )

  const updateProject = useCallback(
    (settings: Partial<ProjectSettings>) => {
      return updateProjectSettings(settings)
    },
    [updateProjectSettings]
  )

  // Get project name from path
  const projectName = projectPath
    ? projectPath.split('/').pop() || 'Unknown Project'
    : null

  return {
    globalSettings,
    currentProjectSettings,
    updateGlobal,
    updateProject,
    hasProject: !!currentProjectId,
    currentProjectId,
    collections: [], // TODO: Get from TanStack Query
    projectPath,
    projectName,
  }
}
