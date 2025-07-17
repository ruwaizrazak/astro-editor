import { useCallback } from 'react'
import { useAppStore } from '../store'
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
  } = useAppStore()

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

  return {
    globalSettings,
    currentProjectSettings,
    updateGlobal,
    updateProject,
    hasProject: !!currentProjectId,
    currentProjectId,
  }
}
