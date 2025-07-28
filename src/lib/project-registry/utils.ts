/**
 * Project registry utilities for identification and path management
 */

import { invoke } from '@tauri-apps/api/core'
import { ProjectMetadata } from './types'

/**
 * Simple hash function for generating project IDs
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 6)
}

/**
 * Generate a unique project ID from package.json name and path
 */
export function generateProjectId(
  name: string,
  path: string,
  existingIds: Set<string>
): string {
  // Clean the name to be filesystem-safe
  const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()

  // If the clean name is unique, use it
  if (!existingIds.has(cleanName)) {
    return cleanName
  }

  // If there's a conflict, add a hash suffix
  const pathHash = simpleHash(path)
  const uniqueId = `${cleanName}-${pathHash}`

  return uniqueId
}

/**
 * Discover project information from a given path
 */
export async function discoverProject(
  projectPath: string,
  existingIds: Set<string>
): Promise<ProjectMetadata> {
  try {
    // Try to read package.json
    const packageJsonPath = `${projectPath}/package.json`
    const packageJsonContent = await invoke<string>('read_file_content', {
      filePath: packageJsonPath,
      projectRoot: projectPath,
    })

    const packageJson = JSON.parse(packageJsonContent) as { name?: string }
    const name =
      packageJson.name || projectPath.split('/').pop() || 'unknown-project'

    const projectId = generateProjectId(name, projectPath, existingIds)

    return {
      id: projectId,
      name,
      path: projectPath,
      lastOpened: new Date().toISOString(),
      created: new Date().toISOString(),
    }
  } catch {
    // Fallback if package.json doesn't exist or is invalid
    const name = projectPath.split('/').pop() || 'unknown-project'
    const projectId = generateProjectId(name, projectPath, existingIds)

    return {
      id: projectId,
      name,
      path: projectPath,
      lastOpened: new Date().toISOString(),
      created: new Date().toISOString(),
    }
  }
}

/**
 * Check if a path appears to be the same project (for migration)
 */
export async function isSameProject(
  projectMetadata: ProjectMetadata,
  newPath: string
): Promise<boolean> {
  try {
    const packageJsonPath = `${newPath}/package.json`
    const packageJsonContent = await invoke<string>('read_file_content', {
      filePath: packageJsonPath,
      projectRoot: newPath,
    })

    const packageJson = JSON.parse(packageJsonContent) as { name?: string }
    return packageJson.name === projectMetadata.name
  } catch {
    // If we can't read package.json, fall back to directory name comparison
    const newName = newPath.split('/').pop() || ''
    return newName === projectMetadata.name
  }
}
