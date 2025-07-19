import { Layout } from './components/Layout'
import { ThemeProvider } from './lib/theme-provider'
import { ComponentBuilderDialog } from './components/ComponentBuilder'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="blog-editor-theme">
      <Layout />
      {/* <ComponentBuilderDialog /> */}
    </ThemeProvider>
  )
}

export default App
