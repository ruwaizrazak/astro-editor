import { invoke } from '@tauri-apps/api/core'
import { info, error } from '@tauri-apps/plugin-log'
import type { RecoveryData, CrashReport } from './types'

export type { RecoveryData, CrashReport }

/**
 * Save recovery data when a save operation fails
 */
export const saveRecoveryData = async (data: {
  currentFile: { path: string; name: string; collection: string } | null
  projectPath: string | null
  editorContent: string
  frontmatter: Record<string, unknown>
}) => {
  if (!data.currentFile) return

  const recoveryData: RecoveryData = {
    timestamp: new Date().toISOString(),
    originalFilePath: data.currentFile.path,
    projectPath: data.projectPath || '',
    editorContent: data.editorContent,
    frontmatter: data.frontmatter,
    fileName: data.currentFile.name,
    collection: data.currentFile.collection,
  }

  try {
    await invoke('save_recovery_data', { data: recoveryData })
    await info(`Recovery data saved for ${recoveryData.fileName}`)
  } catch (err) {
    await error(`Failed to save recovery data: ${err}`)
  }
}

/**
 * Save crash report for debugging critical failures
 */
export const saveCrashReport = async (
  error: Error,
  context: {
    currentFile?: string
    projectPath?: string
    action: string
  }
) => {
  const report: CrashReport = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    platform: navigator.platform,
  }

  try {
    await invoke('save_crash_report', { report })
    await info('Crash report saved')
  } catch (err) {
    await error(`Failed to save crash report: ${err}`)
  }
}
