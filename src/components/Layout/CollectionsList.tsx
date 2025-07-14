import React from 'react'
import { useAppStore, Collection } from '../../store'
import { parseSchemaJson } from '../../lib/schema'

export const CollectionsList: React.FC = () => {
  const {
    collections,
    setSelectedCollection,
    loadCollectionFiles,
    selectedCollection,
  } = useAppStore()

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection.name)
    void loadCollectionFiles(collection.path)
  }

  return (
    <div>
      {collections.map(collection => {
        const isSelected = selectedCollection === collection.name
        const schema = collection.schema
          ? parseSchemaJson(collection.schema)
          : null
        const fieldCount = schema?.fields.length || 0

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
              {schema && (
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground opacity-80">
              {collection.path.split('/').pop()}{' '}
              {/* Show just the directory name */}
            </div>
            {schema && schema.fields.length > 0 && (
              <div className="text-xs text-muted-foreground/60 mt-1">
                {schema.fields
                  .slice(0, 3)
                  .map(field => field.name)
                  .join(', ')}
                {schema.fields.length > 3 && '...'}
              </div>
            )}
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
