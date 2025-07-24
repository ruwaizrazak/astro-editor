import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePreferences } from '../../../hooks/usePreferences'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-900 dark:text-white">
      {label}
    </Label>
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
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const ProjectSettingsPane: React.FC = () => {
  const { currentProjectSettings, updateProject, projectName } =
    usePreferences()

  const handlePathOverrideChange = (
    key: 'contentDirectory' | 'assetsDirectory' | 'mdxComponentsDirectory',
    value: string
  ) => {
    void updateProject({
      pathOverrides: {
        ...currentProjectSettings?.pathOverrides,
        [key]: value || undefined, // Remove empty strings
      },
    })
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="Path Overrides">
        <p className="text-sm text-muted-foreground">
          Override default Astro paths for{' '}
          <span className="font-medium">{projectName}</span>. Paths should be
          relative to the project root.
        </p>

        <SettingsField
          label="Content Directory"
          description="Path to Astro content directory (default: src/content/)"
        >
          <Input
            value={
              currentProjectSettings?.pathOverrides?.contentDirectory || ''
            }
            onChange={e =>
              handlePathOverrideChange('contentDirectory', e.target.value)
            }
            placeholder="src/content/"
          />
        </SettingsField>

        <SettingsField
          label="Assets Directory"
          description="Path to Astro assets directory (default: src/assets/)"
        >
          <Input
            value={currentProjectSettings?.pathOverrides?.assetsDirectory || ''}
            onChange={e =>
              handlePathOverrideChange('assetsDirectory', e.target.value)
            }
            placeholder="src/assets/"
          />
        </SettingsField>

        <SettingsField
          label="MDX Components Directory"
          description="Path to components for use in MDX files (default: src/components/mdx/)"
        >
          <Input
            value={
              currentProjectSettings?.pathOverrides?.mdxComponentsDirectory ||
              ''
            }
            onChange={e =>
              handlePathOverrideChange('mdxComponentsDirectory', e.target.value)
            }
            placeholder="src/components/mdx/"
          />
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
