import React from 'react'
import { useAppStore, FileEntry } from '../../store'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'

export const FilesList: React.FC = () => {
  const {
    files,
    currentFile,
    selectedCollection,
    setSelectedCollection,
    openFile,
  } = useAppStore()

  const handleBackClick = () => {
    setSelectedCollection(null)
  }

  const handleFileClick = (file: FileEntry) => {
    void openFile(file)
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start w-full h-auto px-4 py-2 text-xs text-primary border-b border-border/50 rounded-none hover:bg-accent/50"
        onClick={handleBackClick}
      >
        <ArrowLeft className="size-3 mr-1" />
        Back to Collections
      </Button>

      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
        {selectedCollection}
      </div>

      {files.map(file => (
        <div
          key={file.id}
          className={cn(
            'px-4 py-2 cursor-pointer border-b border-border/50 transition-colors',
            'hover:bg-accent/50',
            file.is_draft && 'bg-yellow-50 border-yellow-200',
            currentFile?.id === file.id && 'bg-primary text-primary-foreground'
          )}
          onClick={() => handleFileClick(file)}
        >
          <div className="text-sm font-medium mb-0.5">
            {file.name}
            {file.is_draft && (
              <span className="text-xs text-yellow-600 font-normal ml-1">
                (draft)
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground opacity-80">
            .{file.extension}
          </div>
        </div>
      ))}

      {files.length === 0 && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No files found in this collection.
        </div>
      )}
    </div>
  )
}
