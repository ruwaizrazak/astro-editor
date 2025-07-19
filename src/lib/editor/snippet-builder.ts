import { MdxComponent } from '../../hooks/queries/useMdxComponentsQuery'

/**
 * Builds an MDX component snippet string for insertion using CodeMirror's snippet system
 * @param component The MDX component to build
 * @param enabledProps Set of prop names that should be included
 * @returns A snippet string with placeholders for tab navigation
 */
export function buildSnippet(
  component: MdxComponent,
  enabledProps: Set<string>
): string {
  let placeholderIndex = 1

  const propsString = component.props
    .filter(p => enabledProps.has(p.name))
    .map(p => {
      // For props with specific values (like 'warning' | 'info'), use the first value as default
      let defaultValue = ''
      if (p.prop_type.includes('|')) {
        // Extract first literal value from union type
        const firstLiteral = p.prop_type.split('|')[0]?.trim()
        if (firstLiteral?.startsWith("'") && firstLiteral?.endsWith("'")) {
          defaultValue = firstLiteral.slice(1, -1)
        }
      }

      // Use snippet placeholder with default value or empty
      // Make sure defaultValue is always a string
      return `${p.name}="$\{${placeholderIndex++}:${defaultValue || ''}\}"`
    })
    .join(' ')

  if (component.has_slot) {
    const propsPrefix = propsString ? ' ' + propsString : ''
    return `<${component.name}${propsPrefix}>$\{${placeholderIndex}\}</${component.name}>$\{\}`
  }

  const propsPrefix = propsString ? ' ' + propsString : ''
  return `<${component.name}${propsPrefix} />$\{\}`
}
