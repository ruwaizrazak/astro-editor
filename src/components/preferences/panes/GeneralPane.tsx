import React, { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePreferences } from '../../../hooks/usePreferences'
import { useTheme } from '../../../lib/theme-provider'
import { useAvailableIdes } from '../../../hooks/useAvailableIdes'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
)

const SettingsSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const GeneralPane: React.FC = () => {
  const { globalSettings, updateGlobal } = usePreferences()
  const { setTheme } = useTheme()
  const { data: availableIdes = [], isLoading: ideLoading } = useAvailableIdes()

  const handleIdeCommandChange = useCallback(
    (value: string) => {
      void updateGlobal({
        general: {
          ideCommand: value === 'none' ? '' : value,
          theme: globalSettings?.general?.theme || 'system',
          highlights: globalSettings?.general?.highlights || {
            nouns: true,
            verbs: true,
            adjectives: true,
            adverbs: true,
            conjunctions: true,
          },
          autoSaveDelay: globalSettings?.general?.autoSaveDelay || 2,
        },
        appearance: {
          headingColor: {
            light: globalSettings?.appearance?.headingColor?.light || '#191919',
            dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
          },
          fontSize: globalSettings?.appearance?.fontSize || 14,
        },
      })
    },
    [updateGlobal, globalSettings?.general, globalSettings?.appearance]
  )

  const handleThemeChange = useCallback(
    (value: 'light' | 'dark' | 'system') => {
      // Update the theme provider immediately for live preview
      setTheme(value)

      // Also save to global settings for persistence
      void updateGlobal({
        general: {
          ideCommand: globalSettings?.general?.ideCommand || '',
          theme: value,
          highlights: globalSettings?.general?.highlights || {
            nouns: true,
            verbs: true,
            adjectives: true,
            adverbs: true,
            conjunctions: true,
          },
          autoSaveDelay: globalSettings?.general?.autoSaveDelay || 2,
        },
        appearance: {
          headingColor: {
            light: globalSettings?.appearance?.headingColor?.light || '#191919',
            dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
          },
          fontSize: globalSettings?.appearance?.fontSize || 14,
        },
      })
    },
    [
      setTheme,
      updateGlobal,
      globalSettings?.general,
      globalSettings?.appearance,
    ]
  )

  const handleHeadingColorChange = useCallback(
    (mode: 'light' | 'dark', color: string) => {
      void updateGlobal({
        general: {
          ideCommand: globalSettings?.general?.ideCommand || '',
          theme: globalSettings?.general?.theme || 'system',
          highlights: globalSettings?.general?.highlights || {
            nouns: true,
            verbs: true,
            adjectives: true,
            adverbs: true,
            conjunctions: true,
          },
          autoSaveDelay: globalSettings?.general?.autoSaveDelay || 2,
        },
        appearance: {
          headingColor: {
            light: globalSettings?.appearance?.headingColor?.light || '#191919',
            dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
            [mode]: color,
          },
          fontSize: globalSettings?.appearance?.fontSize || 14,
        },
      })
    },
    [updateGlobal, globalSettings?.general, globalSettings?.appearance]
  )

  const handleResetHeadingColor = useCallback(
    (mode: 'light' | 'dark') => {
      const defaultColor = mode === 'light' ? '#191919' : '#cccccc'
      handleHeadingColorChange(mode, defaultColor)
    },
    [handleHeadingColorChange]
  )

  const handleAutoSaveDelayChange = useCallback(
    (value: string) => {
      void updateGlobal({
        general: {
          ideCommand: globalSettings?.general?.ideCommand || '',
          theme: globalSettings?.general?.theme || 'system',
          highlights: globalSettings?.general?.highlights || {
            nouns: true,
            verbs: true,
            adjectives: true,
            adverbs: true,
            conjunctions: true,
          },
          autoSaveDelay: parseInt(value, 10),
        },
        appearance: {
          headingColor: {
            light: globalSettings?.appearance?.headingColor?.light || '#191919',
            dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
          },
          fontSize: globalSettings?.appearance?.fontSize || 14,
        },
      })
    },
    [updateGlobal, globalSettings?.general, globalSettings?.appearance]
  )

  const handleFontSizeChange = useCallback(
    (size: number) => {
      void updateGlobal({
        general: {
          ideCommand: globalSettings?.general?.ideCommand || '',
          theme: globalSettings?.general?.theme || 'system',
          highlights: globalSettings?.general?.highlights || {
            nouns: true,
            verbs: true,
            adjectives: true,
            adverbs: true,
            conjunctions: true,
          },
          autoSaveDelay: globalSettings?.general?.autoSaveDelay || 2,
        },
        appearance: {
          headingColor: {
            light: globalSettings?.appearance?.headingColor?.light || '#191919',
            dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
          },
          fontSize: size,
        },
      })
    },
    [updateGlobal, globalSettings?.general, globalSettings?.appearance]
  )

  const handleResetFontSize = useCallback(() => {
    void updateGlobal({
      general: {
        ideCommand: globalSettings?.general?.ideCommand || '',
        theme: globalSettings?.general?.theme || 'system',
        highlights: globalSettings?.general?.highlights || {
          nouns: true,
          verbs: true,
          adjectives: true,
          adverbs: true,
          conjunctions: true,
        },
        autoSaveDelay: globalSettings?.general?.autoSaveDelay || 2,
      },
      appearance: {
        headingColor: {
          light: globalSettings?.appearance?.headingColor?.light || '#191919',
          dark: globalSettings?.appearance?.headingColor?.dark || '#cccccc',
        },
        fontSize: 14,
      },
    })
  }, [updateGlobal, globalSettings?.general, globalSettings?.appearance])

  return (
    <div className="space-y-6">
      <SettingsSection title="General">
        <SettingsField
          label="IDE Command"
          description="Choose your preferred IDE for opening files and projects"
        >
          <Select
            value={globalSettings?.general?.ideCommand || 'none'}
            onValueChange={handleIdeCommandChange}
            disabled={ideLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={ideLoading ? 'Loading...' : 'Select IDE'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {availableIdes.map(ide => {
                const labels: Record<string, string> = {
                  code: 'Visual Studio Code (code)',
                  cursor: 'Cursor (cursor)',
                  subl: 'Sublime Text (subl)',
                  vim: 'Vim (vim)',
                  nvim: 'Neovim (nvim)',
                  emacs: 'Emacs (emacs)',
                }
                return (
                  <SelectItem key={ide} value={ide}>
                    {labels[ide] || `${ide} (${ide})`}
                  </SelectItem>
                )
              })}
              {availableIdes.length === 0 && !ideLoading && (
                <SelectItem value="" disabled>
                  No IDEs detected
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </SettingsField>

        <SettingsField
          label="Theme"
          description="Choose your preferred color theme"
        >
          <Select
            value={globalSettings?.general?.theme || 'system'}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsField
          label="Heading Color (Light Mode)"
          description="Choose the color for markdown headings in light mode"
        >
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={
                globalSettings?.appearance?.headingColor?.light || '#191919'
              }
              onChange={e => handleHeadingColorChange('light', e.target.value)}
              className="w-20 h-9 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResetHeadingColor('light')}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </SettingsField>

        <SettingsField
          label="Heading Color (Dark Mode)"
          description="Choose the color for markdown headings in dark mode"
        >
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={
                globalSettings?.appearance?.headingColor?.dark || '#cccccc'
              }
              onChange={e => handleHeadingColorChange('dark', e.target.value)}
              className="w-20 h-9 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResetHeadingColor('dark')}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </SettingsField>

        <SettingsField
          label="Editor Font Size"
          description="Set the font size for the editor in pixels"
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="8"
              max="32"
              step="1"
              value={globalSettings?.appearance?.fontSize || 14}
              onChange={e => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResetFontSize()}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </SettingsField>
      </SettingsSection>

      <SettingsSection title="Editor">
        <SettingsField
          label="Auto Save Delay"
          description="Time in seconds before auto-saving changes"
        >
          <Select
            value={String(globalSettings?.general?.autoSaveDelay || 2)}
            onValueChange={handleAutoSaveDelayChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 second</SelectItem>
              <SelectItem value="2">2 seconds</SelectItem>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
