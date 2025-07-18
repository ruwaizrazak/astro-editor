import { MdxComponent } from '../../hooks/queries/useMdxComponentsQuery'

/**
 * Builds an MDX component string for insertion
 * @param component The MDX component to build
 * @param enabledProps Set of prop names that should be included
 * @returns A component string ready for insertion
 *
 * Note: Currently generates plain text. To support snippet placeholders,
 * we would need to integrate with CodeMirror's snippet system.
 */
export function buildSnippet(
  component: MdxComponent,
  enabledProps: Set<string>
): string {
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

      // Use empty string for non-enum props, or the first enum value
      return `${p.name}="${defaultValue}"`
    })
    .join(' ')

  if (component.has_slot) {
    const propsPrefix = propsString ? ' ' + propsString : ''
    return `<${component.name}${propsPrefix}>\n  \n</${component.name}>`
  }

  const propsPrefix = propsString ? ' ' + propsString : ''
  return `<${component.name}${propsPrefix} />`
}
