// src/hooks/mutations/useRenameFileMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/lib/toast'

interface RenameFilePayload {
  oldPath: string
  newPath: string
  projectPath: string
  collectionName: string
}

const renameFile = (payload: RenameFilePayload) => {
  return invoke('rename_file', {
    oldPath: payload.oldPath,
    newPath: payload.newPath,
  })
}

export const useRenameFileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renameFile,
    onSuccess: (_, variables) => {
      // Invalidate collection files to show the renamed file
      void queryClient.invalidateQueries({
        queryKey: queryKeys.collectionFiles(
          variables.projectPath,
          variables.collectionName
        ),
      })

      // Invalidate the old file content cache
      void queryClient.invalidateQueries({
        queryKey: queryKeys.fileContent(
          variables.projectPath,
          variables.oldPath
        ),
      })

      toast.success('File renamed successfully')
    },
    onError: error => {
      toast.error('Failed to rename file', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })
}
