// src/hooks/mutations/useDeleteFileMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { remove } from '@tauri-apps/plugin-fs'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/lib/toast'

interface DeleteFilePayload {
  filePath: string
  projectPath: string
  collectionName: string
}

const deleteFile = async (payload: DeleteFilePayload) => {
  // Using the Tauri fs plugin's remove function
  await remove(payload.filePath)
}

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: (_, variables) => {
      // Invalidate collection files to remove the deleted file from the list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionFiles(
          variables.projectPath,
          variables.collectionName
        ),
      })

      // Remove the file content from cache
      queryClient.removeQueries({
        queryKey: queryKeys.fileContent(variables.projectPath, variables.filePath),
      })

      toast.success('File deleted successfully')
    },
    onError: error => {
      toast.error('Failed to delete file', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })
}