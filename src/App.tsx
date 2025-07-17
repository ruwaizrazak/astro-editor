import { Layout } from './components/Layout'
import { ThemeProvider } from './lib/theme-provider'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="blog-editor-theme">
      <Layout />
    </ThemeProvider>
  )
}

export default App
