import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutoGrowingInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AutoGrowingInput = React.forwardRef<
  HTMLTextAreaElement,
  AutoGrowingInputProps
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
  React.useImperativeHandle(ref, () => textareaRef.current!)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [props.value, adjustHeight])

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden min-h-[40px]",
        className
      )}
      rows={1}
      onChange={(e) => {
        props.onChange?.(e)
        adjustHeight()
      }}
      {...props}
    />
  )
})
AutoGrowingInput.displayName = "AutoGrowingInput"

export { AutoGrowingInput }