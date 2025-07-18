import { EditorView } from '@codemirror/view'
import { create } from 'zustand'
import { MdxComponent } from '../hooks/queries/useMdxComponentsQuery'

// Define State and Actions
interface ComponentBuilderState {
  isOpen: boolean
  step: 'list' | 'configure'
  selectedComponent: MdxComponent | null
  enabledProps: Set<string>
  editorView: EditorView | null
}

interface ComponentBuilderActions {
  open: (view: EditorView) => void
  close: () => void
  selectComponent: (component: MdxComponent) => void
  toggleProp: (propName: string) => void
  insert: () => void
  back: () => void
}

const initialState: ComponentBuilderState = {
  isOpen: false,
  step: 'list',
  selectedComponent: null,
  enabledProps: new Set(),
  editorView: null,
}

// Create Store
export const useComponentBuilderStore = create<
  ComponentBuilderState & ComponentBuilderActions
>((set, get) => ({
  ...initialState,

  open: editorView => set({ isOpen: true, editorView }),

  close: () => set({ ...initialState }), // Fully reset on close

  selectComponent: component => {
    const requiredProps = new Set(
      component.props.filter(p => !p.is_optional).map(p => p.name)
    )
    set({
      selectedComponent: component,
      step: 'configure',
      enabledProps: requiredProps,
    })
  },

  toggleProp: propName => {
    set(state => {
      const newEnabledProps = new Set(state.enabledProps)
      if (newEnabledProps.has(propName)) {
        newEnabledProps.delete(propName)
      } else {
        newEnabledProps.add(propName)
      }
      return { enabledProps: newEnabledProps }
    })
  },

  insert: () => {
    const { selectedComponent, enabledProps, editorView } = get()
    if (!selectedComponent || !editorView) return

    // Import the snippet builder and insert command dynamically to avoid circular dependencies
    void (async () => {
      const { buildSnippet } = await import('../lib/editor/snippet-builder')
      const { insertSnippet } = await import(
        '../lib/editor/commands/insertSnippet'
      )

      const snippetString = buildSnippet(selectedComponent, enabledProps)
      insertSnippet(editorView, snippetString)
      get().close() // Close and reset after insertion
    })()
  },

  back: () =>
    set({ step: 'list', selectedComponent: null, enabledProps: new Set() }),
}))
