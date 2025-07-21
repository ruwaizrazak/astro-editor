import React from 'react'
import { useEditorStore, type FileEntry } from '../../store/editorStore'
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
  // PERFORMANCE FIX: Use specific selector instead of currentFile object to avoid cascade
  const hasCurrentFile = useEditorStore(state => !!state.currentFile)

  // DEBUG: Track MainEditor renders
  const renderCountRef = React.useRef(0)
  renderCountRef.current++
  // eslint-disable-next-line no-console
  console.log(`[MainEditor] RENDER #${renderCountRef.current}`, { 
    hasCurrentFile
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--editor-color-background)]">
        {hasCurrentFile ? <Editor /> : <WelcomeScreen />}
      </div>
      <StatusBar />
    </div>
  )
}
