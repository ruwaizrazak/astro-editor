import { Layout } from './components/layout'
import { ThemeProvider } from './lib/theme-provider'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useEffect } from 'react'
import './App.css'

function App() {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check()
        if (update) {
          // eslint-disable-next-line no-console
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
                  // eslint-disable-next-line no-console
                  console.log(`Downloading ${event.data.contentLength} bytes`)
                  break
                case 'Progress':
                  downloaded += event.data.chunkLength
                  // eslint-disable-next-line no-console
                  console.log(`Downloaded: ${downloaded} bytes`)
                  // Update progress bar here
                  break
                case 'Finished':
                  // eslint-disable-next-line no-console
                  console.log('Download complete, installing...')
                  break
              }
            })

            await relaunch()
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Update check failed:', error)
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
