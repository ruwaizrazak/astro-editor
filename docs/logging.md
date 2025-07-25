# Logging in Astro Editor

Astro Editor uses [Tauri's log plugin](https://v2.tauri.app/plugin/log) to integrate with macOS's native logging system.

## Viewing Logs

**Console.app (Recommended):**
1. Open Console.app (`/Applications/Utilities/Console.app`)
2. Search for "Astro Editor" 
3. View real-time logs from the app

**Terminal:**
```bash
# View live logs
log stream --predicate 'process == "astro-editor"'

# View recent logs
log show --last 1h --predicate 'process == "astro-editor"'
```

## Available Log Levels

```typescript
import { trace, debug, info, warn, error } from '@tauri-apps/plugin-log'

await trace('Very detailed debugging info')
await debug('Development debugging info') 
await info('General information')
await warn('Warning messages')
await error('Error messages')
```

## What Gets Logged

**Auto-Updater:**
- Update detection
- Download progress  
- Installation status
- Error reporting

**Project Operations:**
- Project opening/setting
- File watcher start/stop
- Settings saves

**File Operations:**
- File opening failures
- Save failures and recovery
- Recovery data saves
- Crash report saves

## Links

- [Tauri Log Plugin Documentation](https://v2.tauri.app/plugin/log)
- [macOS Console.app Guide](https://support.apple.com/guide/console/welcome/mac)