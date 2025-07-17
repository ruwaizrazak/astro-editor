import { useState, useEffect, useMemo } from 'react'
import { useCommandContext } from '../lib/commands/command-context'
import { getAllCommands } from '../lib/commands/app-commands'
import { AppCommand, CommandGroup } from '../lib/commands/types'

/**
 * Hook for managing command palette state and commands
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const context = useCommandContext()

  // Handle Cmd+P keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.metaKey) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Get all available commands based on current context
  const commands = useMemo(() => getAllCommands(context), [context])

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
    setOpen(false)
    await command.execute(context)
  }

  return {
    open,
    setOpen,
    commands,
    commandGroups,
    executeCommand,
  }
}
