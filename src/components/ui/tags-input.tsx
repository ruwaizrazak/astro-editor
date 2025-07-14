import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface TagsInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  className?: string
}

const TagsInput = React.forwardRef<HTMLDivElement, TagsInputProps>(
  ({ value = [], onChange, placeholder = "Add tags...", className }, ref) => {
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addTag()
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        removeTag(value.length - 1)
      }
    }

    const addTag = () => {
      const trimmedValue = inputValue.trim()
      if (trimmedValue && !value.includes(trimmedValue)) {
        onChange?.([...value, trimmedValue])
        setInputValue("")
      }
    }

    const removeTag = (index: number) => {
      const newTags = value.filter((_, i) => i !== index)
      onChange?.(newTags)
    }

    const handleInputBlur = () => {
      if (inputValue.trim()) {
        addTag()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="gap-1 px-2 py-1"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(index)
              }}
              className="ml-1 hover:bg-muted rounded-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[100px]"
        />
      </div>
    )
  }
)
TagsInput.displayName = "TagsInput"

export { TagsInput }