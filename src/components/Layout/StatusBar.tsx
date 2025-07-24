import React from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

export const StatusBar: React.FC = () => {
  const { currentFile, editorContent, isDirty } = useEditorStore()

  const {
    sidebarVisible,
    frontmatterPanelVisible,
    distractionFreeBarsHidden,
    setDistractionFreeBarsHidden,
  } = useUIStore()

  const wordCount = editorContent
    .split(/\s+/)
    .filter(word => word.length > 0).length
  const charCount = editorContent.length
  const bothPanelsHidden = !sidebarVisible && !frontmatterPanelVisible

  const handleMouseEnter = () => {
    if (distractionFreeBarsHidden) {
      setDistractionFreeBarsHidden(false)
    }
  }

  return (
    <div
      className={cn(
        'flex justify-between items-center px-4 py-1 text-xs min-h-6 border-t',
        bothPanelsHidden
          ? 'bg-[var(--editor-color-background)] border-transparent text-muted-foreground/40'
          : 'bg-gray-50 dark:bg-black border-border text-muted-foreground',
        distractionFreeBarsHidden &&
          bothPanelsHidden &&
          'opacity-0 transition-opacity duration-300'
      )}
      onMouseEnter={handleMouseEnter}
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
