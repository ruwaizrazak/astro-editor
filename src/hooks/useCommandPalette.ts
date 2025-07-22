import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCommandContext } from '../lib/commands/command-context'
import { getAllCommands } from '../lib/commands/app-commands'
import { AppCommand, CommandGroup } from '../lib/commands/types'
import { useUIStore } from '../store/uiStore'

/**
 * Hook for managing command palette state and commands
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const context = useCommandContext()
  const { setDistractionFreeBarsHidden } = useUIStore()

  // Custom setOpen that shows bars when command palette opens
  const handleSetOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setOpen(value)
      // Show bars when command palette opens
      if (typeof value === 'boolean' ? value : value(open)) {
        setDistractionFreeBarsHidden(false)
      }
    },
    [open, setDistractionFreeBarsHidden]
  )

  // Handle Cmd+P keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.metaKey) {
        e.preventDefault()
        handleSetOpen(open => !open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSetOpen])

  // Get all available commands based on current context
  // Optimize dependencies to prevent unnecessary recalculations that could disrupt navigation
  const commands = useMemo(() => getAllCommands(context), [
    context.currentFile?.id,
    context.selectedCollection,
    context.projectPath,
    context.isDirty,
    context.globalSettings?.general?.ideCommand,
    context.collections.length, // Only react to collection count changes, not array reference
  ])

  // Group commands by category
  const commandGroups = useMemo((): CommandGroup[] => {
    const groups: Record<string, AppCommand[]> = {}

    commands.forEach(command => {
      if (!groups[command.group]) {
        groups[command.group] = []
      }
      groups[command.group]!.push(command)
    })

    // Define group order and labels
    const groupOrder: Array<{ key: string; heading: string }> = [
      { key: 'file', heading: 'File' },
      { key: 'navigation', heading: 'Navigation' },
      { key: 'project', heading: 'Project' },
      { key: 'settings', heading: 'Settings' },
      { key: 'ide', heading: 'IDE' },
    ]

    return groupOrder
      .filter(group => groups[group.key] && groups[group.key]!.length > 0)
      .map(group => ({
        heading: group.heading,
        commands: groups[group.key]!,
      }))
  }, [commands])

  // Execute a command and close the palette
  const executeCommand = async (command: AppCommand) => {
    handleSetOpen(false)
    await command.execute(context)
  }

  return {
    open,
    setOpen: handleSetOpen,
    commands,
    commandGroups,
    executeCommand,
  }
}
