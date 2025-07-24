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

## Phase 3: GitHub Actions Workflow (2-3 hours)

### 3.1 Create Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: 'Release Astro Editor'

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., v1.0.0)'
        required: true
        type: string

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  create-release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.result }}

    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'

      - name: Get version
        run: echo "PACKAGE_VERSION=$(node -pe "require('./package.json').version")" >> $GITHUB_ENV

      - name: Create release
        id: create-release
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: `v${process.env.PACKAGE_VERSION}`,
              name: `Astro Editor v${process.env.PACKAGE_VERSION}`,
              body: `## 🚀 Astro Editor v${process.env.PACKAGE_VERSION}
              
              ### Installation Instructions
              - **macOS**: Download the \`.dmg\` file and drag to Applications folder
              - **Windows**: Download the \`.msi\` installer and run it
              - **Linux**: Download the \`.AppImage\` or \`.deb\` file
              
              ### Auto-Updates
              Existing users will receive automatic update notifications.
              
              **Full Changelog**: https://github.com/${{ github.repository }}/commits/v${process.env.PACKAGE_VERSION}`,
              draft: true,
              prerelease: false
            })
            return data.id

  build-tauri:
    needs: create-release
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target universal-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: '--bundles deb,appimage'
          - platform: 'windows-latest'
            args: '--bundles msi'

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'universal-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf

      - name: Install frontend dependencies
        run: npm ci

      - name: Build application
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}
          includeUpdaterJson: true
          args: ${{ matrix.args }}

  publish-release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    needs: [create-release, build-tauri]

    steps:
      - name: Publish release
        id: publish-release
        uses: actions/github-script@v7
        env:
          release_id: ${{ needs.create-release.outputs.release_id }}
        with:
          script: |
            github.rest.repos.updateRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              release_id: process.env.release_id,
              draft: false
            })
```

### 3.2 Setup GitHub Secrets

In your GitHub repository settings → Secrets and variables → Actions, add:

- `TAURI_PRIVATE_KEY`: Content of your `astro-editor.key` file (the private key)

**Security Note**: Never commit the private key to your repository.

## Phase 4: Pre-Release Automation (1 hour)

NOTE FOR CLAUDE: STOP BEFORE DOING THIS PHASE TO REWORK THE PLAN WITH THE USER

### 4.1 Version Coordination Script

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

## Phase 5: Testing and Validation (2 hours)

### 5.1 Local Testing Setup

1. **Test Update Generation**:

   ```bash
   npm run tauri build
   # Verify updater artifacts are created in src-tauri/target/release/bundle/
   ```

2. **Test Update Server**:
   Create a simple local test by manually creating `latest.json`:
   ```json
   {
     "version": "1.0.1",
     "notes": "Test update",
     "pub_date": "2025-07-24T10:00:00Z",
     "platforms": {
       "darwin-universal": {
         "signature": "signature_here",
         "url": "https://github.com/your-username/astro-editor/releases/download/v1.0.1/app-universal.dmg"
       }
     }
   }
   ```

### 5.2 Pre-release Testing Workflow

1. **Create test releases** using pre-release tags:

   ```bash
   npm run prepare-release v1.0.0-beta.1
   ```

2. **Test multi-platform builds** in GitHub Actions

3. **Verify signature verification** by intentionally corrupting a signature

## Cost Analysis

### Immediate Costs (Free)

- ✅ GitHub Actions (2000 minutes/month free)
- ✅ Ad-hoc signing for macOS
- ✅ Unsigned Windows builds
- ✅ GitHub releases hosting

### Optional Upgrades

- **macOS signing**: $99/year (recommended when user base > 100)

## Security Considerations

### Critical Security Measures

1. **Private key protection**: Never commit to git, use GitHub secrets only
2. **HTTPS enforcement**: GitHub releases use HTTPS by default
3. **Signature verification**: Handled automatically by Tauri updater
4. **Update frequency limits**: Check on startup only, not continuously

### Security Threats Mitigated

- **Man-in-the-middle attacks**: Cryptographic signatures
- **Supply chain attacks**: Verified build pipeline
- **Downgrade attacks**: Version comparison in updater
- **Unauthorized updates**: Private key requirement

## Implementation Checklist

### Phase 1 (Immediate)

- [x] Generate update signing keys
- [x] Install updater plugin
- [x] Configure tauri.conf.json
- [x] Test local build with updater artifacts

### Phase 2 (Frontend)

- [x] Add update check to main component
- [x] Implement progress reporting
- [x] Add error handling and user feedback
- [x] Test update flow locally

### Phase 3 (CI/CD)

- [ ] Create GitHub Actions workflow
- [ ] Add TAURI_PRIVATE_KEY secret
- [ ] Test workflow with pre-release tag
- [ ] Verify multi-platform builds

### Phase 4 (Automation)

- [ ] Create prepare-release script
- [ ] Add npm scripts
- [ ] Test full release workflow
- [ ] Document release process

### Phase 5 (Testing)

- [ ] Test update generation
- [ ] Verify signature verification
- [ ] Test error handling
- [ ] Validate all platforms

## Troubleshooting Guide

### Common Issues

**"Failed to verify signature"**

- Verify public key in tauri.conf.json matches private key
- Ensure TAURI_PRIVATE_KEY secret is correctly set
- Check that createUpdaterArtifacts is enabled

**"Update check failed"**

- Verify endpoint URL is correct
- Check network connectivity
- Ensure GitHub release has updater JSON files

**Build failures in GitHub Actions**

- Check Rust cache issues (clear cache)
- Verify platform-specific dependencies
- Review secret configuration

**Version mismatches**

- Ensure package.json and Cargo.toml versions match
- Use prepare-release script for coordination
- Verify git tags match version numbers
