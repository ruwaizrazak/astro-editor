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

### Rust Backend Logging

For logging from Rust commands, use the standard `log` crate which integrates with the Tauri log plugin:

```rust
use log::{debug, error, info, warn};

// Usage in Tauri commands
#[tauri::command]
pub async fn my_command() -> Result<String, String> {
    info!("Command started");
    debug!("Debug information with variable: {some_var}");
    warn!("Warning about something: {warning_msg}");
    error!("Error occurred: {error_msg}");
    
    Ok("Success".to_string())
}
```

**Rust Log Levels:**
- `debug!()` - Development debugging info
- `info!()` - General information 
- `warn!()` - Warning messages
- `error!()` - Error messages

**Note:** Use modern Rust formatting (`{variable}`) instead of old-style (`{}`, variable) to satisfy clippy linting.

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
- File opening failures (Rust backend)
- Save failures and recovery (Rust backend)
- Recovery data saves (Rust backend)  
- Crash report saves (Rust backend)

**IDE Integration:**
- IDE command execution attempts (Rust backend)
- PATH environment fixes (Rust backend)
- Command failures and suggestions (Rust backend)

**Security Operations:**
- Blocked directory access attempts (Rust backend)
- Path validation failures (Rust backend)

## Links

- [Tauri Log Plugin Documentation](https://v2.tauri.app/plugin/log)
- [macOS Console.app Guide](https://support.apple.com/guide/console/welcome/mac)