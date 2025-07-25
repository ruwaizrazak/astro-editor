# Task: Auto Software Update and Releases

**Status**: Ready for implementation  
**Research Completed**: 2025-07-24  
**Implementation Phases**: 7 phases, prioritized by complexity and cost

## Executive Summary

This document provides a comprehensive technical implementation plan for adding auto-update functionality and professional release management to the Astro Editor. Based on extensive research into Tauri v2 best practices, GitHub Actions workflows, and 2025 code signing requirements, this plan balances functionality, security, and cost for a single-developer project.

**Key Decisions Made:**

- **Release Strategy**: Trunk-based development with semantic version tags
- **Code Signing**: Start with ad-hoc (macOS) and unsigned (Windows), upgrade when justified
- **Auto-Updates**: GitHub releases as update server with cryptographic verification
- **CI/CD**: GitHub Actions with tauri-apps/tauri-action for multi-platform builds

## Phase 1: Foundation Setup (Immediate - 1-2 hours) ✅ DONE

### 1.1 Generate Update Signing Keys

```bash
# Generate cryptographic keys for update verification
npm run tauri signer generate -w ~/.tauri/astro-editor.key
```

This creates:

- `astro-editor.key` (private key - never commit this)
- `astro-editor.key.pub` (public key - embed in app)

### 1.2 Install Updater Plugin

```bash
npm run tauri add updater
npm install @tauri-apps/plugin-updater
```

### 1.3 Configure Tauri for Auto-Updates

Update `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "createUpdaterArtifacts": true,
    "identifier": "is.danny.astroeditor",
    "macOS": {
      "signingIdentity": "-",
      "minimumSystemVersion": "10.13"
    }
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/dannysmith/astro-editor/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "PASTE_PUBLIC_KEY_CONTENT_HERE"
    }
  }
}
```

**Critical**: Replace `YOUR_USERNAME` and paste the actual content from `astro-editor.key.pub`

### 1.4 Setup Semantic Versioning

```bash
npm install --save-dev semantic-release @semantic-release/changelog @semantic-release/git
```

Create `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/git"
  ]
}
```

## Phase 2: Frontend Integration (1 hour) ✅ DONE

### 2.1 Update Check Implementation

Add to `src/components/layout/Layout.tsx` or main app component:

```typescript
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useEffect } from 'react'

// Add inside your main component
useEffect(() => {
  const checkForUpdates = async () => {
    try {
      const update = await check()
      if (update) {
        console.log(`Update available: ${update.version}`)

        // Show toast notification or modal
        const shouldUpdate = confirm(
          `Update available: ${update.version}\n\n${update.body}\n\nInstall now?`
        )

        if (shouldUpdate) {
          let downloaded = 0

          await update.downloadAndInstall(event => {
            switch (event.event) {
              case 'Started':
                console.log(`Downloading ${event.data.contentLength} bytes`)
                break
              case 'Progress':
                downloaded += event.data.chunkLength
                console.log(`Downloaded: ${downloaded} bytes`)
                // Update progress bar here
                break
              case 'Finished':
                console.log('Download complete, installing...')
                break
            }
          })

          await relaunch()
        }
      }
    } catch (error) {
      console.error('Update check failed:', error)
      // Show user-friendly error message
    }
  }

  // Check for updates 5 seconds after app loads
  const timer = setTimeout(checkForUpdates, 5000)
  return () => clearTimeout(timer)
}, [])
```

### 2.2 Update Rust Main File

Update `src-tauri/src/main.rs`:

```rust
// Prevent additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Phase 3: GitHub Actions Workflow ✅ DONE

### 3.1 Create Release Workflow

- Create `.github/workflows/release.yml`:

### 3.2 Setup GitHub Secrets

In your GitHub repository settings → Secrets and variables → Actions, add:

- `TAURI_PRIVATE_KEY`: Content of your `astro-editor.key` file (the private key)

**Security Note**: Never commit the private key to your repository.

## Phase 4: Pre-Release Automation

### 4.1 Version Coordination Script

Okay, this script should:

- Run all checks and fail if any problems.
- Check that the working dir is clean in git.
- Update the version in the three files: package.json, Cargo.toml and tauri.conf.json.
- Run npm install and whatever build command is needed to update Cargo.lock
- Check things are correct (see checks below)
- Print out the git commands nececarry to make a release so I can run them.

We might actually want to build a little utility script which is Interactive and allows me to confirm the git commands just by pressing Enter, and then have the script run them. But only if we can do this without too much complexity. It should also include a reminder that this will create a draught release, so I'll need to manually publish it on github once the build is finished.

Create `scripts/prepare-release.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs')
const { execSync } = require('child_process')

async function prepareRelease() {
  const version = process.argv[2]
  if (!version || !version.match(/^v?\d+\.\d+\.\d+$/)) {
    console.error('❌ Usage: node scripts/prepare-release.js v1.0.0')
    process.exit(1)
  }

  const cleanVersion = version.replace('v', '')

  try {
    // Run all checks first
    console.log('🔍 Running pre-release checks...')
    execSync('npm run check:all', { stdio: 'inherit' })
    console.log('✅ All checks passed')

    // Update package.json
    console.log('📝 Updating package.json...')
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    pkg.version = cleanVersion
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')

    // Update Cargo.toml
    console.log('📝 Updating Cargo.toml...')
    const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8')
    const updatedCargo = cargoToml.replace(
      /version = "[^"]*"/,
      `version = "${cleanVersion}"`
    )
    fs.writeFileSync('src-tauri/Cargo.toml', updatedCargo)

    // Verify Tauri config has correct bundle identifier
    console.log('🔍 Verifying Tauri configuration...')
    const tauriConfig = JSON.parse(
      fs.readFileSync('src-tauri/tauri.conf.json', 'utf8')
    )
    if (!tauriConfig.bundle?.createUpdaterArtifacts) {
      console.warn(
        '⚠️  Warning: createUpdaterArtifacts not enabled in tauri.conf.json'
      )
    }
    if (!tauriConfig.plugins?.updater?.pubkey) {
      console.warn('⚠️  Warning: Updater public key not configured')
    }

    console.log(`✅ Ready for release ${version}!`)
    console.log('\n📋 Next steps:')
    console.log('1. git add .')
    console.log(`2. git commit -m "chore: release ${version}"`)
    console.log(`3. git tag ${version}`)
    console.log('4. git push origin main --tags')
    console.log('\n🚀 GitHub Actions will automatically build and release!')
  } catch (error) {
    console.error('❌ Pre-release checks failed:', error.message)
    process.exit(1)
  }
}

prepareRelease()
```

Make it executable:

```bash
chmod +x scripts/prepare-release.js
```

### 4.2 Add to package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "prepare-release": "node scripts/prepare-release.js",
    "check:all": "npm run type-check && npm run lint && cargo check --manifest-path src-tauri/Cargo.toml"
  }
}
```

## Phase 5: Update docs
