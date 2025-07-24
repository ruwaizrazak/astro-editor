# Preferences System Documentation

## Overview

The preferences system manages both global user settings and project-specific settings. It uses a project registry to track opened projects and their individual configurations.

## File Storage

- **Location**: `/Users/danny/Library/Application\ Support/is.danny.astroeditor/`

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

## How Overrides Work in the Application

### Path Overrides

When path overrides are configured, the application automatically uses them throughout:

**Content Directory Override:**

- **Collection Scanning**: Uses `scan_project_with_content_dir` Tauri command instead of default
- **File Watching**: Uses `start_watching_project_with_content_dir` to watch the custom directory
- **Default**: `src/content/` → **Override Example**: `content/` or `docs/`

**Assets Directory Override:**

- **Drag & Drop**: Uses `copy_file_to_assets_with_override` when files are dropped into editor
- **File Processing**: Automatically copies files to the configured assets path
- **Default**: `src/assets/` → **Override Example**: `public/images/` or `static/`

**MDX Components Directory Override:**

- **Reserved for Future**: Not currently used but structure is in place
- **Default**: `src/components/mdx/`

### Frontmatter Field Mappings

The application uses configured field mappings for enhanced functionality:

**Published Date Field:**

- **File Sorting**: Sidebar sorts files by the configured date field(s)
- **Supports Multiple Fields**: Can specify array like `["pubDate", "date", "publishedDate"]`
- **File List Display**: Shows formatted date under file titles
- **Default**: `["pubDate", "date", "publishedDate"]` → **Override Example**: `"published"` or `["releaseDate"]`

**Title Field:**

- **File List Display**: Uses configured field for file titles in sidebar
- **Frontmatter Panel**: Renders with special large, bold textarea styling
- **Fallback**: Uses filename if frontmatter field is empty
- **Default**: `"title"` → **Override Example**: `"heading"` or `"name"`

**Description Field:**

- **Frontmatter Panel**: Renders with larger textarea (3-16 rows)
- **Special Styling**: Gets enhanced treatment for long-form content
- **Default**: `"description"` → **Override Example**: `"summary"` or `"excerpt"`

**Draft Field:**

- **File List Indicators**: Shows "Draft" badge for files marked as draft
- **Visual Styling**: Applies yellow background to draft files in sidebar
- **Boolean Detection**: Checks if configured field equals `true`
- **Default**: `"draft"` → **Override Example**: `"published"` (inverted) or `"isDraft"`

### Implementation Details

**Settings Resolution:**

```typescript
// Application uses effective settings that merge global + project overrides
const { pathOverrides, frontmatterMappings } = useEffectiveSettings()

// Path override example
if (contentDirectory && contentDirectory !== 'src/content') {
  collections = await invoke('scan_project_with_content_dir', {
    projectPath,
    contentDirectory,
  })
}

// Frontmatter mapping example
const title = getTitle(file, frontmatterMappings.title)
const publishedDate = getPublishedDate(
  file.frontmatter,
  frontmatterMappings.publishedDate
)
```

**Backwards Compatibility:**

- If no overrides are configured, uses default behavior exactly as before
- Gradual fallback: project override → global default → hardcoded default
- All existing projects continue working without configuration

## Future Extensions

The system is designed to easily support:

- Project-specific themes/UI preferences
- Recent files per project
- Custom keybindings per project
- Project templates and defaults
- Workspace management
