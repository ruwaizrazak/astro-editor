export interface RecoveryData {
  timestamp: string
  originalFilePath: string
  projectPath: string
  editorContent: string
  frontmatter: Record<string, unknown>
  fileName: string
  collection: string
}

export interface CrashReport {
  timestamp: string
  error: string
  stack?: string
  context: {
    currentFile?: string
    projectPath?: string
    action: string
  }
  appVersion?: string
  platform: string
}
