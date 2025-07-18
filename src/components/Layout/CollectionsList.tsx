import React, { useState, useEffect } from 'react'
import { useAppStore, Collection } from '../../store'
import { invoke } from '@tauri-apps/api/core'

export const CollectionsList: React.FC = () => {
  const {
    collections,
    setSelectedCollection,
    loadCollectionFiles,
    selectedCollection,
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
        } catch (error) {
          console.warn(`Failed to load file count for ${collection.name}:`, error)
          counts[collection.name] = 0
        }
      }
      
      setFileCounts(counts)
    }

    if (collections.length > 0) {
      void loadFileCounts()
    }
  }, [collections])

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection.name)
    void loadCollectionFiles(collection.path)
  }

  return (
    <div>
      {collections.map(collection => {
        const isSelected = selectedCollection === collection.name
        const fileCount = fileCounts[collection.name] ?? 0

        return (
          <div
            key={collection.name}
            className={`px-4 py-3 cursor-pointer border-b border-border/50 transition-colors ${
              isSelected
                ? 'bg-accent/80 text-accent-foreground'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => handleCollectionClick(collection)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">{collection.name}</div>
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                {fileCount} item{fileCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-xs text-muted-foreground opacity-80">
              {collection.path.split('/').pop()}{' '}
              {/* Show just the directory name */}
            </div>
          </div>
        )
      })}

      {collections.length === 0 && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No collections found. Open an Astro project to get started.
        </div>
      )}
    </div>
  )
}
