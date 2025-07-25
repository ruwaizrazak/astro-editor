import { Layout } from './components/layout'
import { ThemeProvider } from './lib/theme-provider'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { info, error } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import './App.css'

function App() {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check()
        if (update) {
          await info(`Update available: ${update.version}`)

          // Show toast notification or modal
          const shouldUpdate = confirm(
            `Update available: ${update.version}\n\nWould you like to install this update now?`
          )

          if (shouldUpdate) {
            try {
              // Download and install silently with only console logging
              await update.downloadAndInstall(async event => {
                switch (event.event) {
                  case 'Started':
                    await info(`Downloading ${event.data.contentLength} bytes`)
                    break
                  case 'Progress':
                    await info(`Downloaded: ${event.data.chunkLength} bytes`)
                    break
                  case 'Finished':
                    await info('Download complete, installing...')
                    break
                }
              })

              // Ask if user wants to restart now
              const shouldRestart = confirm(
                'Update completed successfully!\n\nWould you like to restart the app now to use the new version?'
              )

              if (shouldRestart) {
                await relaunch()
              }
            } catch (updateError) {
              await error(`Update installation failed: ${updateError}`)
              alert(`Update failed: There was a problem with the automatic download.\n\n${updateError}`)
            }
          }
        }
      } catch (checkError) {
        await error(`Update check failed: ${checkError}`)
        // Show user-friendly error message
      }
    }

    // Check for updates 5 seconds after app loads
    const timer = setTimeout(checkForUpdates, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="astro-editor-theme">
      <Layout />
    </ThemeProvider>
  )
}

export default App
