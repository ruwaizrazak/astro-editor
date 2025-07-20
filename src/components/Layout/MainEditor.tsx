import React from 'react'
import { useAppStore, type FileEntry } from '../../store'
import { Editor } from '../editor'
import { StatusBar } from '.'

// Welcome screen component for better organization
const WelcomeScreen: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-muted-foreground">
      <h2 className="m-0 mb-4 text-2xl font-light">Welcome to Astro Editor</h2>
      <p className="m-0 text-sm">
        Select a project folder to get started, then choose a file to edit.
      </p>
    </div>
  </div>
)

export const MainEditor: React.FC = () => {
  const { currentFile }: { currentFile: FileEntry | null } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--editor-color-background)]">
        {currentFile ? <Editor /> : <WelcomeScreen />}
      </div>
      <StatusBar />
    </div>
  )
}
