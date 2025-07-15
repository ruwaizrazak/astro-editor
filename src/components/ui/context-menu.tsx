import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { LogicalPosition } from '@tauri-apps/api/dpi'
import { invoke } from '@tauri-apps/api/core'
import { remove } from '@tauri-apps/plugin-fs'
import { openPath } from '@tauri-apps/plugin-opener'
import { ask } from '@tauri-apps/plugin-dialog'
import type { FileEntry } from '../../store'

interface ContextMenuOptions {
  file: FileEntry
  position: { x: number; y: number }
  onRefresh?: () => void
  onRename?: (file: FileEntry) => void
}

export class FileContextMenu {
  private static async showConfirmationDialog(
    fileName: string
  ): Promise<boolean> {
    return ask(`Are you sure you want to delete "${fileName}"?`, {
      title: 'Delete File',
      kind: 'warning',
    })
  }

  private static generateDuplicatePath(originalPath: string): string {
    const lastSlashIndex = originalPath.lastIndexOf('/')
    const directory = originalPath.substring(0, lastSlashIndex)
    const fileName = originalPath.substring(lastSlashIndex + 1)

    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      // No extension
      return `${directory}/${fileName}-1`
    }

    const nameWithoutExt = fileName.substring(0, lastDotIndex)
    const extension = fileName.substring(lastDotIndex)
    return `${directory}/${nameWithoutExt}-1${extension}`
  }

  static async show({
    file,
    position,
    onRefresh,
    onRename,
  }: ContextMenuOptions): Promise<void> {
    try {
      // eslint-disable-next-line no-console
      console.log('Context menu for file:', file)
      // Create menu items
      const revealItem = await MenuItem.new({
        id: 'reveal-in-finder',
        text: 'Reveal in Finder',
        action: () => {
          void (async () => {
            try {
              // eslint-disable-next-line no-console
              console.log('Reveal in Finder clicked for path:', file.path)
              // Get the directory containing the file
              const directory = file.path.substring(
                0,
                file.path.lastIndexOf('/')
              )
              // eslint-disable-next-line no-console
              console.log('Opening directory:', directory)
              await openPath(directory)
              // eslint-disable-next-line no-console
              console.log('openPath completed successfully')
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to reveal in Finder:', error)
            }
          })()
        },
      })

      const copyPathItem = await MenuItem.new({
        id: 'copy-path',
        text: 'Copy Path',
        action: () => {
          void (async () => {
            try {
              // eslint-disable-next-line no-console
              console.log('Copy path clicked for:', file.path)
              await invoke('copy_text_to_clipboard', { text: file.path })
              // eslint-disable-next-line no-console
              console.log('Path copied to clipboard successfully')
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to copy path:', error)
            }
          })()
        },
      })

      const duplicateItem = await MenuItem.new({
        id: 'duplicate-file',
        text: 'Duplicate',
        action: () => {
          void (async () => {
            try {
              // eslint-disable-next-line no-console
              console.log('Duplicate clicked for file:', file.path)
              const duplicatePath = FileContextMenu.generateDuplicatePath(
                file.path
              )
              // eslint-disable-next-line no-console
              console.log('Duplicating to:', duplicatePath)

              // Read the original file content
              const content = await invoke('read_file', {
                filePath: file.path,
              })

              // Parse the duplicate path into directory and filename
              const lastSlashIndex = duplicatePath.lastIndexOf('/')
              const directory = duplicatePath.substring(0, lastSlashIndex)
              const filename = duplicatePath.substring(lastSlashIndex + 1)

              // Create the duplicate file
              await invoke('create_file', { directory, filename, content })
              // eslint-disable-next-line no-console
              console.log('File duplicated successfully')

              // Refresh the file list if callback is provided
              if (onRefresh) {
                onRefresh()
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to duplicate file:', error)
            }
          })()
        },
      })

      const renameItem = await MenuItem.new({
        id: 'rename-file',
        text: 'Rename',
        action: () => {
          try {
            // eslint-disable-next-line no-console
            console.log('Rename clicked for file:', file.path)
            if (onRename) {
              onRename(file)
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to initiate rename:', error)
          }
        },
      })

      const separator = await PredefinedMenuItem.new({
        text: 'separator',
        item: 'Separator',
      })

      const deleteItem = await MenuItem.new({
        id: 'delete-file',
        text: 'Delete',
        action: () => {
          void (async () => {
            try {
              // eslint-disable-next-line no-console
              console.log('Delete clicked for file:', file.path)
              const confirmed = await FileContextMenu.showConfirmationDialog(
                file.name || file.path.split('/').pop() || 'file'
              )
              // eslint-disable-next-line no-console
              console.log('Delete confirmation result:', confirmed)
              if (confirmed) {
                // eslint-disable-next-line no-console
                console.log('Attempting to delete file:', file.path)
                await remove(file.path)
                // eslint-disable-next-line no-console
                console.log('File deleted successfully')
                // Refresh the file list if callback is provided
                if (onRefresh) {
                  onRefresh()
                }
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to delete file:', error)
            }
          })()
        },
      })

      // Create and show the context menu
      const menu = await Menu.new({
        items: [
          revealItem,
          copyPathItem,
          duplicateItem,
          renameItem,
          separator,
          deleteItem,
        ],
      })

      // Show the menu at the specified position
      await menu.popup(new LogicalPosition(position.x, position.y))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to show context menu:', error)
    }
  }
}
