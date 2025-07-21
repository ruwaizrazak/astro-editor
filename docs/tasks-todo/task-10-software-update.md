# Task: Auto Software Update and Releases

See: https://v2.tauri.app/distribute/

## Phase 1 - Pre-Release Checklist, Scripts and Workflow

- Define simple release workflow based on standard best practices. Document in repo.
- Create pre-release script which runs all checks and checks any manual stuff I should care about. Should also incrment version number, check packaged details etc as needed.
- (Optional) Create claude code command to help with this

## Phase 1 - Building releases on GitHub

- Add a CHANGELOG.md in a sensible format
- Use GitHub Actions and tags etc to properly build and label releases on Github. See https://github.com/tauri-apps/tauri-action for more
- Releases should be properly signed in accordance with the Tauri documentation (https://v2.tauri.app/distribute/sign/macos/)
- https://v2.tauri.app/distribute/pipelines/github/

## Phase 2 - In-App Auto-Update

- Use https://v2.tauri.app/plugin/updater/ to automatically check GitHub for new releases and update.
