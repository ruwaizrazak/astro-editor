import React from 'react'
import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'

export const StatusBar: React.FC = () => {
  const {
    currentFile,
    editorContent,
    isDirty,
    sidebarVisible,
    frontmatterPanelVisible,
  } = useAppStore()

  const wordCount = editorContent
    .split(/\s+/)
    .filter(word => word.length > 0).length
  const charCount = editorContent.length
  const bothPanelsHidden = !sidebarVisible && !frontmatterPanelVisible

  return (
    <div
      className={cn(
        'flex justify-between items-center px-4 py-1 text-xs h-6 border-t',
        bothPanelsHidden
          ? 'bg-[var(--editor-color-background)] border-transparent text-muted-foreground/40'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      <div className="flex items-center">
        {currentFile && (
          <span>
            {currentFile.name}.{currentFile.extension}
            {isDirty && <span className="text-primary font-bold"> •</span>}
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {currentFile && (
          <>
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </>
        )}
      </div>
    </div>
  )
}
