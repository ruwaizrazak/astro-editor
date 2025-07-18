import React from 'react'
import { Code2, FileCode2 } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { useComponentBuilderStore } from '../../store/componentBuilderStore'
import { useMdxComponentsQuery } from '../../hooks/queries/useMdxComponentsQuery'
import { useAppStore } from '../../store'

/**
 * MDX Component Builder Dialog
 * Allows users to select and configure MDX components for insertion into the editor
 */
export function ComponentBuilderDialog() {
  const { projectPath } = useAppStore()
  const {
    isOpen,
    step,
    selectedComponent,
    enabledProps,
    close,
    selectComponent,
    toggleProp,
    insert,
    back,
  } = useComponentBuilderStore()

  // Fetch MDX components using TanStack Query
  const { data: components = [], isLoading } =
    useMdxComponentsQuery(projectPath)

  // Custom filter function that only searches component names and descriptions
  const customFilter = React.useCallback((value: string, search: string) => {
    // Extract the label from the value
    const label = value.toLowerCase()

    // Case-insensitive search
    if (label.includes(search.toLowerCase())) {
      return 1
    }
    return 0
  }, [])

  const handleInsert = (e?: React.FormEvent) => {
    e?.preventDefault()
    void insert()
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={close}
      title="Insert MDX Component"
      description="Select a component to insert"
      filter={customFilter}
    >
      {step === 'list' ? (
        <>
          <CommandInput placeholder="Search components..." />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading components...</CommandEmpty>
            ) : components.length === 0 ? (
              <CommandEmpty>
                No MDX components found in this project.
              </CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Available Components">
                  {components.map(component => (
                    <CommandItem
                      key={component.name}
                      value={component.name}
                      onSelect={() => selectComponent(component)}
                      className="cursor-pointer"
                    >
                      <FileCode2 className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>&lt;{component.name} /&gt;</span>
                        {component.description && (
                          <span className="text-xs text-muted-foreground">
                            {component.description}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {component.props.length} props
                          {component.has_slot && ' • Has slot'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </>
      ) : (
        <form onSubmit={handleInsert} className="p-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Configure &lt;{selectedComponent?.name} /&gt;
                  </CardTitle>
                  <CardDescription>
                    Select the props you want to include
                  </CardDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={back}>
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedComponent?.props.map(prop => (
                <div
                  key={prop.name}
                  className="flex items-center justify-between space-x-2"
                >
                  <Label
                    htmlFor={prop.name}
                    className="flex-1 flex items-center gap-2"
                  >
                    <span>{prop.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({prop.prop_type})
                    </span>
                    {!prop.is_optional && (
                      <span className="text-xs text-destructive">required</span>
                    )}
                  </Label>
                  <Switch
                    id={prop.name}
                    checked={enabledProps.has(prop.name)}
                    onCheckedChange={() => toggleProp(prop.name)}
                    disabled={!prop.is_optional}
                  />
                </div>
              ))}
              {selectedComponent?.has_slot && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <Code2 className="inline h-3 w-3 mr-1" />
                    This component has a slot for child content
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Insert Component
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </CommandDialog>
  )
}
