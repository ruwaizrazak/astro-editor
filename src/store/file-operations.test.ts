import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './index'

describe('File Operations Business Logic', () => {
  beforeEach(() => {
    useAppStore.setState({
      projectPath: '/test/project',
      collections: [
        {
          name: 'posts',
          path: '/test/project/src/content/posts',
          schema: JSON.stringify({
            type: 'zod',
            fields: [
              { name: 'title', type: 'String', optional: false },
              { name: 'pubDate', type: 'Date', optional: true },
              { name: 'draft', type: 'Boolean', optional: true },
              { name: 'tags', type: 'Array', optional: true },
            ],
          }),
        },
      ],
      selectedCollection: 'posts',
      files: [],
      currentFile: null,
    })
    globalThis.mockTauri.reset()
  })

  describe('New File Creation', () => {
    it('should create new file with schema-based frontmatter defaults', async () => {
      const mockExistingFiles = [
        {
          id: 'posts/existing',
          path: '/test/project/src/content/posts/existing.md',
          name: 'existing',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
      ]

      // Mock the scan_collection_files call first, then create_file
      globalThis.mockTauri.invoke
        .mockResolvedValueOnce(mockExistingFiles) // scan_collection_files
        .mockResolvedValueOnce('/test/project/src/content/posts/2025-07-15.md') // create_file

      const { createNewFile } = useAppStore.getState()
      await createNewFile()

      // Should first scan collection files
      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith(
        'scan_collection_files',
        {
          collectionPath: '/test/project/src/content/posts',
        }
      )

      // Then create file with proper frontmatter
      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('create_file', {
        directory: '/test/project/src/content/posts',
        filename: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}(-\d+)?\.md$/
        ) as string,
        content: expect.stringContaining('---') as string,
      })

      // Verify frontmatter has required fields from schema
      const createCall = globalThis.mockTauri.invoke.mock.calls.find(
        call => call[0] === 'create_file'
      ) as
        | [string, { directory: string; filename: string; content: string }]
        | undefined
      const content = createCall?.[1]?.content
      expect(content).toContain('title: "New Post"')
      expect(content).toContain(
        'pubDate: "' + new Date().toISOString().split('T')[0] + '"'
      )
    })

    it('should handle collections without date fields', async () => {
      const collectionWithoutDate = {
        name: 'notes',
        path: '/test/project/src/content/notes',
        schema: JSON.stringify({
          type: 'zod',
          fields: [{ name: 'content', type: 'String', optional: false }],
        }),
      }

      useAppStore.setState({
        collections: [collectionWithoutDate],
        selectedCollection: 'notes',
      })

      // Mock empty collection files and successful creation
      globalThis.mockTauri.invoke
        .mockResolvedValueOnce([]) // scan_collection_files
        .mockResolvedValueOnce('/test/project/src/content/notes/2025-07-15.md') // create_file

      const { createNewFile } = useAppStore.getState()
      await createNewFile()

      const createCall = globalThis.mockTauri.invoke.mock.calls.find(
        call => call[0] === 'create_file'
      ) as
        | [string, { directory: string; filename: string; content: string }]
        | undefined
      const content = createCall?.[1]?.content
      expect(content).not.toContain('pubDate')
      expect(content).not.toContain('date')
      expect(content).toContain('content: ""')
    })
  })
})
