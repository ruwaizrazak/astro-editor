import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

/**
 * Hook to get available IDEs on the current system
 */
export function useAvailableIdes() {
  return useQuery({
    queryKey: ['available-ides'],
    queryFn: async () => {
      const ides = await invoke<string[]>('get_available_ides')
      return ides
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - IDEs don't change often
    retry: 1, // Only retry once on failure
  })
}
