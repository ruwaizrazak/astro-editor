import React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore, Collection, FileEntry } from '../../store'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FolderOpen, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseSchemaJson } from '../../lib/schema'

function formatDate(dateString: string | number | Date): string {
  try {
    const date = new Date(dateString)
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

function getPublishedDate(frontmatter: Record<string, unknown>): Date | null {
  const dateFields = ['pubDate', 'date', 'publishedDate', 'published']
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

function getTitle(file: FileEntry): string {
  // Use frontmatter title if available, otherwise filename
  if (file.frontmatter?.title && typeof file.frontmatter.title === 'string') {
    return file.frontmatter.title
  }
  return (
    file.name ||
    file.path
      .split('/')
      .pop()
      ?.replace(/\.(md|mdx)$/, '') ||
    'Untitled'
  )
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
  } = useAppStore()

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

  // Sort files by published date (reverse chronological), files without dates first
  const sortedFiles = React.useMemo(() => {
    return [...files].sort((a, b) => {
      const dateA = getPublishedDate(a.frontmatter || {})
      const dateB = getPublishedDate(b.frontmatter || {})

      // Files without dates go to top
      if (!dateA && !dateB) return 0
      if (!dateA) return -1
      if (!dateB) return 1

      // Sort by date descending (newest first)
      return dateB.getTime() - dateA.getTime()
    })
  }, [files])

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
              const schema = collection.schema
                ? parseSchemaJson(collection.schema)
                : null
              const fieldCount = schema?.fields?.length || 0

              return (
                <button
                  key={collection.name}
                  onClick={() => handleCollectionClick(collection)}
                  className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{collection.name}</span>
                    {fieldCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
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
              const title = getTitle(file)
              const publishedDate = getPublishedDate(file.frontmatter || {})
              const isMdx = file.extension === 'mdx'
              const isFileDraft =
                file.is_draft || file.frontmatter?.draft === true
              const isSelected = currentFile?.id === file.id

              return (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
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
                        {file.name}
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
