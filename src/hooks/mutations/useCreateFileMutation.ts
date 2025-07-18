// src/hooks/mutations/useCreateFileMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/lib/toast'

interface CreateFilePayload {
  directory: string
  filename: string
  content: string
  projectPath: string
  collectionName: string
}

const createFile = (payload: CreateFilePayload) => {
  return invoke('create_file', {
    directory: payload.directory,
    filename: payload.filename,
    content: payload.content,
  })
}

export const useCreateFileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFile,
    onSuccess: (_, variables) => {
      // Invalidate collection files to show the new file
      void queryClient.invalidateQueries({
        queryKey: queryKeys.collectionFiles(
          variables.projectPath,
          variables.collectionName
        ),
      })

      toast.success('New file created successfully')
    },
    onError: error => {
      toast.error('Failed to create new file', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })
}
