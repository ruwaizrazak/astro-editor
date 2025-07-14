import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AutoExpandingTextareaProps
  extends React.ComponentProps<'textarea'> {
  minRows?: number
  maxRows?: number
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(({ className, minRows = 1, maxRows, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Calculate the height based on content
    let newHeight = textarea.scrollHeight

    // Apply min/max rows constraints if specified
    if (minRows || maxRows) {
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const padding =
        parseInt(getComputedStyle(textarea).paddingTop) +
        parseInt(getComputedStyle(textarea).paddingBottom)

      if (minRows) {
        const minHeight = lineHeight * minRows + padding
        newHeight = Math.max(newHeight, minHeight)
      }

      if (maxRows) {
        const maxHeight = lineHeight * maxRows + padding
        newHeight = Math.min(newHeight, maxHeight)
      }
    }

    textarea.style.height = `${newHeight}px`
  }, [minRows, maxRows])

  // Combined ref function to handle both internal and forwarded refs
  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  // Adjust height when value changes
  React.useEffect(() => {
    adjustHeight()
  }, [props.value, adjustHeight])

  // Adjust height on mount
  React.useLayoutEffect(() => {
    adjustHeight()
  }, [adjustHeight])

  return (
    <textarea
      ref={setRef}
      className={cn(
        // Base styles from shadcn textarea but without field-sizing-content
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // Remove field-sizing-content and add resize-none overflow-hidden
        'resize-none overflow-hidden',
        // Set a minimum height
        'min-h-[2.5rem]',
        className
      )}
      onInput={adjustHeight}
      {...props}
    />
  )
})

AutoExpandingTextarea.displayName = 'AutoExpandingTextarea'

export { AutoExpandingTextarea }
