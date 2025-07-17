# Preferences System Documentation

## Overview

The preferences system manages both global user settings and project-specific settings. It uses a project registry to track opened projects and their individual configurations.

## File Storage

- **Location**: `/Users/danny/Library/Application\ Support/com.astroeditor.app/`

### File Structure

```
preferences/
├── global-settings.json          # Global user preferences
├── project-registry.json         # Index of all opened projects
└── projects/
    ├── {project-id}.json         # Individual project settings
    └── {project-id-2}.json       # Another project's settings
```

## Project Identification

Projects are identified by their `package.json` name:

- **Primary ID**: Clean version of package.json name (e.g., `my-blog`)
- **Conflict Resolution**: If name conflicts exist, adds path hash (e.g., `my-blog-a1b2c3`)
- **Fallback**: If no package.json, uses directory name
- **Migration**: Automatically detects moved projects by matching package.json name

## Data Types

### Global Settings

```typescript
{
  general: {
    ideCommand: string           // Command for "Open in IDE" (e.g., "code")
    theme: 'light' | 'dark' | 'system'
  },
  defaultProjectSettings: ProjectSettings,  // Defaults for new projects
  version: number
}
```

### Project Settings

```typescript
{
  pathOverrides: {
    contentDirectory?: string     // Default: "src/content/"
    assetsDirectory?: string      // Default: "src/assets/"
    mdxComponentsDirectory?: string // Default: "src/components/mdx/"
  },
  frontmatterMappings: {
    publishedDate?: string        // Default: "date"
    title?: string               // Default: "title"
    description?: string         // Default: "description"
    draft?: string              // Default: "draft"
  }
}
```

### Project Registry

```typescript
{
  projects: Record<string, ProjectMetadata>,  // projectId -> metadata
  lastOpenedProject: string | null,
  version: number
}
```

## Usage in Store

### Accessing Settings

```typescript
// In components
const { globalSettings, currentProjectSettings } = useAppStore()

// Effective settings (global defaults + project overrides)
const effectiveSettings =
  await projectRegistryManager.getEffectiveSettings(projectId)
```

### Updating Settings

```typescript
// Update global settings
await updateGlobalSettings({
  general: { ideCommand: 'code' },
})

// Update project settings
await updateProjectSettings({
  pathOverrides: { contentDirectory: 'content/' },
})
```

## API Reference

### ProjectRegistryManager

- `initialize()` - Initialize the system (called on app start)
- `registerProject(path)` - Register/update a project, returns projectId
- `getProjectData(projectId)` - Get full project data
- `getEffectiveSettings(projectId)` - Get combined global + project settings
- `updateGlobalSettings(settings)` - Update global settings
- `updateProjectSettings(projectId, settings)` - Update project settings

### Store Actions

- `initializeProjectRegistry()` - Initialize on app start
- `updateGlobalSettings(settings)` - Update global settings with toast feedback
- `updateProjectSettings(settings)` - Update current project settings

## How It Works

1. **App Startup**:
   - `initializeProjectRegistry()` called from `loadPersistedProject()`
   - Loads global settings and project registry
   - Logs app data directory to console

2. **Opening a Project**:
   - `setProject(path)` registers the project
   - Discovers project info from package.json
   - Loads effective settings (global + project overrides)
   - Updates `currentProjectId` and `currentProjectSettings` in store

3. **Project Migration**:
   - If project path changes, system detects it's the same project
   - Updates path in registry automatically
   - Preserves all project-specific settings

4. **Settings Precedence**:
   - Global settings provide defaults
   - Project settings override globals
   - `getEffectiveSettings()` merges both

## Implementation Notes

- Settings are auto-saved when updated
- All operations include error handling with toast notifications
- Project data is cached in memory for performance
- Falls back to localStorage for backward compatibility
- Works with both development and production builds

## Testing

- Check browser console for app data directory path
- Open a project to trigger registry creation
- Navigate to preferences directory to see created files
- Move a project and reopen to test migration
- Check `window.__TAURI__.core.invoke('get_app_data_dir')` in console

## Future Extensions

The system is designed to easily support:

- Project-specific themes/UI preferences
- Recent files per project
- Custom keybindings per project
- Project templates and defaults
- Workspace management
