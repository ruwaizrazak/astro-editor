import { useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../store'
import { useCollectionsQuery } from './queries/useCollectionsQuery'
import { useCreateFileMutation } from './mutations/useCreateFileMutation'
import { parseSchemaJson, getDefaultValueForField } from '../lib/schema'
import { toast } from '../lib/toast'
import { FileEntry } from '../store'

// Helper function to singularize collection name
const singularize = (word: string): string => {
  const pluralRules = [
    { suffix: 'ies', replacement: 'y' }, // stories -> story
    { suffix: 'es', replacement: 'e' }, // articles -> article (not articl)
    { suffix: 's', replacement: '' }, // notes -> note
  ]

  for (const rule of pluralRules) {
    if (word.endsWith(rule.suffix)) {
      return word.slice(0, -rule.suffix.length) + rule.replacement
    }
  }
  return word
}

export const useCreateFile = () => {
  const {
    selectedCollection,
    projectPath,
    currentProjectSettings,
    openFile,
    frontmatterPanelVisible,
    toggleFrontmatterPanel,
  } = useAppStore()

  const { data: collections = [] } = useCollectionsQuery(
    projectPath,
    currentProjectSettings?.pathOverrides?.contentDirectory
  )

  const createFileMutation = useCreateFileMutation()

  const createNewFile = useCallback(async () => {
    if (!selectedCollection || !projectPath) {
      toast.error('No collection selected')
      return
    }

    const collection = collections.find(c => c.name === selectedCollection)
    if (!collection) {
      toast.error('Collection not found')
      return
    }

    try {
      // Generate filename based on today's date
      const today = new Date().toISOString().split('T')[0]
      let filename = `${today}.md`
      let counter = 1

      // Check if file exists and increment counter if needed
      const collectionFiles = await invoke<FileEntry[]>(
        'scan_collection_files',
        {
          collectionPath: collection.path,
        }
      )

      const existingNames = new Set(
        collectionFiles.map(f =>
          f.extension ? `${f.name}.${f.extension}` : f.name
        )
      )

      while (existingNames.has(filename)) {
        filename = `${today}-${counter}.md`
        counter++
      }

      // Generate default frontmatter from schema
      const schema = collection.schema
        ? parseSchemaJson(collection.schema)
        : null
      const defaultFrontmatter: Record<string, unknown> = {}

      // Track if we have a title field in the schema
      let hasTitleField = false

      // Generate default title
      const singularName = singularize(selectedCollection)
      const defaultTitle = `New ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`

      if (schema?.fields) {
        for (const field of schema.fields) {
          // Check if this is a title field
          if (field.name.toLowerCase() === 'title') {
            hasTitleField = true
            // Always include title field with default value
            defaultFrontmatter[field.name] = defaultTitle
          }
          // Check for date fields (pubDate, date, publishedDate)
          else if (
            field.type === 'Date' &&
            (field.name.toLowerCase() === 'pubdate' ||
              field.name.toLowerCase() === 'date' ||
              field.name.toLowerCase() === 'publisheddate')
          ) {
            // Only add date fields if they exist in the schema
            defaultFrontmatter[field.name] = today
          }
          // Include other required fields
          else if (!field.optional) {
            defaultFrontmatter[field.name] = getDefaultValueForField(field)
          }
        }
      }

      // Create YAML frontmatter with proper type formatting
      const frontmatterYaml =
        Object.keys(defaultFrontmatter).length > 0
          ? `---\n${Object.entries(defaultFrontmatter)
              .map(([key, value]) => {
                if (typeof value === 'string') {
                  return `${key}: "${value}"`
                } else if (typeof value === 'boolean') {
                  return `${key}: ${value}` // Don't quote booleans
                } else if (Array.isArray(value)) {
                  return `${key}: []` // Empty array
                } else if (typeof value === 'number') {
                  return `${key}: ${value}` // Don't quote numbers
                }
                return `${key}: ${String(value)}`
              })
              .join('\n')}\n---\n\n`
          : ''

      // Create the file
      await createFileMutation.mutateAsync({
        directory: collection.path,
        filename,
        content: frontmatterYaml,
        projectPath,
        collectionName: selectedCollection,
      })

      // Find and open the newly created file
      const updatedFiles = await invoke<FileEntry[]>('scan_collection_files', {
        collectionPath: collection.path,
      })

      const newFile = updatedFiles.find(
        f => (f.extension ? `${f.name}.${f.extension}` : f.name) === filename
      )

      if (newFile) {
        await openFile(newFile)

        // Open frontmatter panel if we have a title field
        if (hasTitleField && !frontmatterPanelVisible) {
          toggleFrontmatterPanel()
        }

        // Focus the appropriate element after a delay to allow UI to update
        setTimeout(() => {
          if (hasTitleField) {
            // Try to find and focus the title field by ID
            const titleField = document.getElementById(
              'frontmatter-title-field'
            ) as HTMLTextAreaElement
            if (titleField) {
              titleField.focus()
              titleField.select()
            }
          } else {
            // No title field, focus the main editor
            const cmEditor = document.querySelector(
              '.cm-editor .cm-content'
            ) as HTMLElement
            if (cmEditor) {
              cmEditor.focus()
            }
          }
        }, 200)
      }
    } catch (error) {
      toast.error('Failed to create new file', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  }, [
    selectedCollection,
    projectPath,
    collections,
    openFile,
    frontmatterPanelVisible,
    toggleFrontmatterPanel,
    createFileMutation,
  ])

  return { createNewFile }
}