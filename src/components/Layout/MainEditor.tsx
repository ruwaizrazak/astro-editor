import React from 'react'
import { useAppStore } from '../../store'
import { EditorView } from './index'
import { StatusBar } from './StatusBar'

export const MainEditor: React.FC = () => {
  const { currentFile } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {currentFile ? (
          <EditorView />
        ) : (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center text-muted-foreground">
              <h2 className="m-0 mb-4 text-2xl font-light">
                Welcome to Astro Editor
              </h2>
              <p className="m-0 text-sm">
                Select a project folder to get started, then choose a file to
                edit.
              </p>
            </div>
          </div>
        )}
      </div>

      <StatusBar />
    </div>
  )
}
