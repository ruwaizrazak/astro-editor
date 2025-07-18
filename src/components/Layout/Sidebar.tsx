import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore, type Collection, type FileEntry } from '../../store'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FolderOpen, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileContextMenu } from '../ui/context-menu'
import { useEffectiveSettings } from '../../lib/project-registry/utils-effective'

// Type-safe helper functions for file handling
function formatDate(dateValue: unknown): string {
  if (!dateValue) return ''

  try {
    const date = new Date(dateValue as string | number | Date)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function getPublishedDate(
  frontmatter: Record<string, unknown>,
  publishedDateField: string | string[]
): Date | null {
  // Handle both single string and array of field names
  const dateFields = Array.isArray(publishedDateField)
    ? publishedDateField
    : [publishedDateField]

  for (const field of dateFields) {
    const value = frontmatter[field]
    if (value) {
      const date = new Date(value as string)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }
  return null
}

function getTitle(file: FileEntry, titleField: string): string {
  // Use frontmatter title if available, otherwise derive from filename
  if (
    file.frontmatter?.[titleField] &&
    typeof file.frontmatter[titleField] === 'string'
  ) {
    return file.frontmatter[titleField]
  }

  // Extract filename without extension as fallback
  const filename = file.name || file.path.split('/').pop() || 'Untitled'
  return filename.replace(/\.(md|mdx)$/, '')
}

export const Sidebar: React.FC = () => {
  const {
    selectedCollection,
    collections,
    files,
    currentFile,
    setProject,
    setSelectedCollection,
    loadCollectionFiles,
    openFile,
  }: {
    selectedCollection: string | null
    collections: Collection[]
    files: FileEntry[]
    currentFile: FileEntry | null
    setProject: (path: string) => void
    setSelectedCollection: (collection: string | null) => void
    loadCollectionFiles: (collectionPath: string) => Promise<void>
    openFile: (file: FileEntry) => Promise<void>
  } = useAppStore()

  const [fileCounts, setFileCounts] = useState<Record<string, number>>({})

  // Load file counts for all collections
  useEffect(() => {
    const loadFileCounts = async () => {
      const counts: Record<string, number> = {}

      for (const collection of collections) {
        try {
          const files = await invoke<unknown[]>('scan_collection_files', {
            collectionPath: collection.path,
          })
          counts[collection.name] = files.length
        } catch {
          counts[collection.name] = 0
        }
      }

      setFileCounts(counts)
    }

    if (collections.length > 0) {
      void loadFileCounts()
    }
  }, [collections])

  // Get effective settings for frontmatter field mappings
  const { frontmatterMappings } = useEffectiveSettings()

  // State for rename functionality
  const [renamingFileId, setRenamingFileId] = React.useState<string | null>(
    null
  )
  const [renameValue, setRenameValue] = React.useState('')
  const renameInitializedRef = React.useRef(false)

  const handleOpenProject = async () => {
    try {
      const result = await invoke<string | null>('select_project_folder')
      if (result) {
        setProject(result)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open project:', error)
    }
  }

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection.name)
    void loadCollectionFiles(collection.path)
  }

  const handleBackClick = () => {
    setSelectedCollection(null)
  }

  const handleFileClick = (file: FileEntry) => {
    void openFile(file)
  }

  const handleContextMenu = async (
    event: React.MouseEvent,
    file: FileEntry
  ) => {
    event.preventDefault()
    event.stopPropagation()

    await FileContextMenu.show({
      file,
      position: { x: event.clientX, y: event.clientY },
      onRefresh: () => {
        // Refresh the file list by reloading the collection
        if (selectedCollection) {
          void loadCollectionFiles(
            collections.find(c => c.name === selectedCollection)?.path || ''
          )
        }
      },
      onRename: handleRename,
    })
  }

  const handleRename = (file: FileEntry) => {
    setRenamingFileId(file.id)
    // Include extension in the edit value
    const fullName = file.extension
      ? `${file.name}.${file.extension}`
      : file.name
    setRenameValue(fullName || '')
    renameInitializedRef.current = false // Reset for new rename session
  }

  // Focus and select filename without extension when rename input is rendered
  React.useEffect(() => {
    if (renamingFileId && !renameInitializedRef.current) {
      renameInitializedRef.current = true
      const timeoutId = setTimeout(() => {
        const input = document.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement
        if (input && renameValue) {
          input.focus()
          const lastDotIndex = renameValue.lastIndexOf('.')
          if (lastDotIndex > 0) {
            // Select filename without extension
            input.setSelectionRange(0, lastDotIndex)
          } else {
            // Select all if no extension
            input.select()
          }
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [renamingFileId, renameValue])

  const handleRenameSubmit = async (file: FileEntry) => {
    if (!renameValue.trim() || renameValue === file.name) {
      setRenamingFileId(null)
      return
    }

    try {
      const directory = file.path.substring(0, file.path.lastIndexOf('/'))
      const newPath = `${directory}/${renameValue}`

      await invoke('rename_file', {
        oldPath: file.path,
        newPath: newPath,
      })

      setRenamingFileId(null)
      setRenameValue('')

      // Refresh the file list
      if (selectedCollection) {
        void loadCollectionFiles(
          collections.find(c => c.name === selectedCollection)?.path || ''
        )
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to rename file:', error)
    }
  }

  const handleRenameCancel = () => {
    setRenamingFileId(null)
    setRenameValue('')
  }

  const handleRenameKeyDown = (event: React.KeyboardEvent, file: FileEntry) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleRenameSubmit(file)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      handleRenameCancel()
    }
  }

  // Sort files by published date (reverse chronological), files without dates first
  const sortedFiles = React.useMemo((): FileEntry[] => {
    return [...files].sort((a, b) => {
      const dateA = getPublishedDate(
        a.frontmatter || {},
        frontmatterMappings.publishedDate
      )
      const dateB = getPublishedDate(
        b.frontmatter || {},
        frontmatterMappings.publishedDate
      )

      // Files without dates go to top
      if (!dateA && !dateB) return 0
      if (!dateA) return -1
      if (!dateB) return 1

      // Sort by date descending (newest first)
      return dateB.getTime() - dateA.getTime()
    })
  }, [files, frontmatterMappings.publishedDate])

  const headerTitle = selectedCollection
    ? selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)
    : 'Collections'

  return (
    <div className="h-full flex flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          {selectedCollection && (
            <Button
              onClick={handleBackClick}
              variant="ghost"
              size="sm"
              className="size-6 p-0"
              title="Back to Collections"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          {!selectedCollection && (
            <Button
              onClick={() => void handleOpenProject()}
              variant="ghost"
              size="sm"
              className="size-6 p-0"
              title="Open Project"
            >
              <FolderOpen className="size-4" />
            </Button>
          )}
          <span className="text-sm font-medium text-foreground flex-1">
            {headerTitle}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedCollection ? (
          // Collections List
          <div className="p-2">
            {collections.map(collection => {
              const fileCount = fileCounts[collection.name] ?? 0

              return (
                <button
                  key={collection.name}
                  onClick={() => handleCollectionClick(collection)}
                  className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{collection.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {fileCount} item{fileCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {collection.path.split('/').pop()}
                  </div>
                </button>
              )
            })}
            {collections.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No collections found. Open an Astro project to get started.
              </div>
            )}
          </div>
        ) : (
          // Files List
          <div className="p-2">
            {sortedFiles.map(file => {
              const title = getTitle(file, frontmatterMappings.title)
              const publishedDate = getPublishedDate(
                file.frontmatter || {},
                frontmatterMappings.publishedDate
              )
              const isMdx = file.extension === 'mdx'
              const isFileDraft =
                file.is_draft ||
                file.frontmatter?.[frontmatterMappings.draft] === true
              const isSelected = currentFile?.id === file.id

              return (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  onContextMenu={e => void handleContextMenu(e, file)}
                  className={cn(
                    'w-full text-left p-3 rounded-md transition-colors',
                    'hover:bg-accent',
                    isFileDraft && 'bg-yellow-50/50 hover:bg-yellow-100/50',
                    isSelected && 'bg-primary/15 hover:bg-primary/20'
                  )}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight truncate">
                        {title}
                      </div>
                      {publishedDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(publishedDate)}
                        </div>
                      )}
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        {renamingFileId === file.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => handleRenameKeyDown(e, file)}
                            onBlur={() => void handleRenameSubmit(file)}
                            className="bg-background border border-border rounded px-1 py-0.5 text-xs font-mono w-full"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : file.extension ? (
                          `${file.name}.${file.extension}`
                        ) : (
                          file.name
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {isFileDraft && (
                        <Badge
                          variant="destructive"
                          className="text-xs px-1 py-0"
                        >
                          Draft
                        </Badge>
                      )}
                      {isMdx && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          MDX
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            {sortedFiles.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No files found in this collection.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
