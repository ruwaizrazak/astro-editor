import { Layout } from './components/layout'
import { ThemeProvider } from './lib/theme-provider'
import { ComponentBuilderDialog } from './components/component-builder'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="astro-editor-theme">
      <Layout />
      <ComponentBuilderDialog />
    </ThemeProvider>
  )
}

export default App
