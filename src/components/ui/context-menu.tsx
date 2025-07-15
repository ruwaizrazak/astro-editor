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

  static async show({
    file,
    position,
    onRefresh,
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
        items: [revealItem, copyPathItem, separator, deleteItem],
      })

      // Show the menu at the specified position
      await menu.popup(new LogicalPosition(position.x, position.y))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to show context menu:', error)
    }
  }
}
