import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { useMdxComponentsStore } from '../../store/mdxComponentsStore'

interface PropInfo {
  name: string
  prop_type: string
  is_optional: boolean
  default_value?: string | null
}

interface MdxComponent {
  name: string
  file_path: string
  props: PropInfo[]
  has_slot: boolean
  description?: string | null
}

function createSnippet(component: MdxComponent): string {
  const requiredProps = component.props.filter(p => !p.is_optional)
  
  const propsString = requiredProps
    .map(p => {
      const defaultVal = p.default_value ?? undefined
      const placeholder = getPlaceholderForType(p.prop_type, defaultVal)
      return `${p.name}="${placeholder}"`
    })
    .join(' ')
  
  const propsWithSpace = propsString ? ` ${propsString}` : ''
  
  if (component.has_slot) {
    return `<${component.name}${propsWithSpace}></${component.name}>`
  } else {
    return `<${component.name}${propsWithSpace} />`
  }
}

function getPlaceholderForType(type: string, defaultValue?: string): string {
  // If there's a default value, use it
  if (defaultValue) {
    return defaultValue
  }
  
  // Handle union types (e.g., "'warning' | 'info'")
  if (type.includes('|')) {
    const options = type.split('|').map(t => t.trim().replace(/['"]/g, ''))
    return options[0] || '' // Return first option as default
  }
  
  // Handle basic types
  switch (type.toLowerCase()) {
    case 'string':
      return ''
    case 'number':
      return '0'
    case 'boolean':
      return 'false'
    default:
      return type
  }
}

function isInsideUrlOrTag(context: CompletionContext): boolean {
  const tree = syntaxTree(context.state)
  const pos = context.pos
  let node: any = tree.resolveInner(pos, -1)
  
  // Walk up the syntax tree to check parent nodes
  while (node) {
    const nodeType = node.name
    
    // Check if we're inside a URL
    if (nodeType === 'URL' || nodeType === 'Link') {
      return true
    }
    
    // Check if we're inside an HTML/JSX tag
    if (nodeType === 'HTMLTag' || 
        nodeType === 'JSXElement' || 
        nodeType === 'JSXOpeningElement' ||
        nodeType === 'JSXClosingElement' ||
        nodeType === 'HTMLOpenTag' ||
        nodeType === 'HTMLCloseTag') {
      return true
    }
    
    // Also check for being inside angle brackets
    const text = context.state.doc.sliceString(node.from, node.to)
    if (text.includes('<') && !text.includes('>')) {
      return true
    }
    
    node = node.parent
  }
  
  return false
}

export function mdxComponentCompletion() {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        // Check if the character before the cursor is a '/'
        const trigger = context.state.sliceDoc(context.pos - 1, context.pos)
        if (trigger !== '/') {
          return null
        }
        
        // Check if we're inside a URL or HTML tag
        if (isInsideUrlOrTag(context)) {
          return null
        }
        
        // Get components from the store
        const components = useMdxComponentsStore.getState().components
        
        // Create completion options
        const options: Completion[] = components.map(comp => ({
          label: comp.name,
          type: 'class',
          detail: comp.description || undefined,
          info: () => {
            // Build info string with props
            const propsInfo = comp.props
              .map(p => `${p.name}${p.is_optional ? '?' : ''}: ${p.prop_type}`)
              .join('\n  ')
            
            const infoText = propsInfo ? `Props:\n  ${propsInfo}` : 'No props'
            return { dom: document.createTextNode(infoText) }
          },
          apply: (view, _completion, from, to) => {
            // Replace the '/' with the component snippet
            const snippet = createSnippet(comp)
            view.dispatch({
              changes: { from: from - 1, to, insert: snippet },
              selection: { anchor: from - 1 + snippet.length }
            })
          }
        }))
        
        return {
          from: context.pos,
          options,
          validFor: /^[a-zA-Z]*$/ // Allow filtering by typing letters
        }
      }
    ]
  })
}