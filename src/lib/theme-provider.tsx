
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react'
import { useProjectStore } from '../store/projectStore'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderContext {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderContext = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderContext>(initialState)

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'astro-editor-theme',
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const { globalSettings } = useProjectStore()

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        root.classList.remove('light', 'dark')
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.add(newSystemTheme)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    root.classList.add(theme)
  }, [theme])

  // Apply font size from preferences to CSS custom property
  useEffect(() => {
    const fontSize = globalSettings?.appearance?.fontSize || 14
    
    // Set the user font size preference that will override responsive sizing
    document.documentElement.style.setProperty('--editor-user-font-size', `${fontSize}px`)
  }, [globalSettings?.appearance?.fontSize])

  const handleSetTheme = useCallback(
    (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    [storageKey]
  )

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
    }),
    [theme, handleSetTheme]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
