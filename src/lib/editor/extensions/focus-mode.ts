import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { findCurrentSentence, shouldExcludeLineFromFocus } from '../sentence-detection'

// State effect to toggle focus mode
export const toggleFocusMode = StateEffect.define<boolean>()

// State field to track focus mode state
export const focusModeState = StateField.define<{
  enabled: boolean
  currentSentence: { from: number; to: number } | null
}>({
  create() {
    console.log('[FocusModeState] Creating initial state')
    return { enabled: false, currentSentence: null }
  },
  
  update(value, tr) {
    let newValue = value
    
    // Handle focus mode toggle effects
    for (const effect of tr.effects) {
      if (effect.is(toggleFocusMode)) {
        console.log('[FocusModeState] Received toggleFocusMode effect:', effect.value)
        newValue = { ...newValue, enabled: effect.value }
      }
    }
    
    // Update current sentence if cursor moved or focus mode is enabled
    if ((tr.selection || tr.docChanged) && newValue.enabled) {
      console.log('[FocusModeState] Updating current sentence, cursor at:', tr.state.selection.main.head)
      const currentSentence = findCurrentSentence(
        tr.state, 
        tr.state.selection.main.head
      )
      console.log('[FocusModeState] Current sentence:', currentSentence)
      newValue = { ...newValue, currentSentence }
    }
    
    if (newValue !== value) {
      console.log('[FocusModeState] State changed from', value, 'to', newValue)
    }
    
    return newValue
  }
})

// Focus mode decorations with simplified approach for better compatibility
export const focusModeDecorations = StateField.define<any>({
  create() {
    console.log('[FocusModeDecorations] Creating initial decorations')
    return Decoration.none
  },
  
  update(decorations: any, tr: any) {
    const focusState = tr.state.field(focusModeState)
    console.log('[FocusModeDecorations] Update called, focus state:', focusState)
    
    if (!focusState.enabled || !focusState.currentSentence) {
      console.log('[FocusModeDecorations] Focus mode disabled or no current sentence')
      return Decoration.none
    }
    
    // Performance: Only update if selection changed or document changed
    if (!tr.selection && !tr.docChanged) {
      console.log('[FocusModeDecorations] No selection or doc change, keeping existing decorations')
      return decorations.map(tr.changes)
    }
    
    const marks: any[] = []
    const doc = tr.state.doc
    const currentSentence = focusState.currentSentence
    
    // Process all lines in the document (simplified for now)
    for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
      const lineInfo = doc.line(lineNum)
      const lineText = lineInfo.text
      
      // Skip lines that should be excluded
      if (shouldExcludeLineFromFocus(lineText)) continue
      
      // Dim text before current sentence
      if (lineInfo.from < currentSentence.from) {
        const dimEnd = Math.min(currentSentence.from, lineInfo.to)
        if (dimEnd > lineInfo.from) {
          marks.push(
            Decoration.mark({ class: 'cm-focus-dimmed' }).range(
              lineInfo.from,
              dimEnd
            )
          )
        }
      }
      
      // Dim text after current sentence
      if (lineInfo.to > currentSentence.to) {
        const dimStart = Math.max(currentSentence.to, lineInfo.from)
        if (dimStart < lineInfo.to) {
          marks.push(
            Decoration.mark({ class: 'cm-focus-dimmed' }).range(
              dimStart,
              lineInfo.to
            )
          )
        }
      }
    }
    
    console.log('[FocusModeDecorations] Created', marks.length, 'decoration marks')
    if (marks.length > 0) {
      console.log('[FocusModeDecorations] First mark:', marks[0])
    }
    
    return Decoration.set(marks, true)
  },
  
  provide: f => EditorView.decorations.from(f)
})

// Main focus mode plugin
export const focusModePlugin = ViewPlugin.fromClass(
  class {
    constructor(public view: EditorView) {}
    
    update(_update: ViewUpdate) {
      // Plugin automatically updates via state fields
      // Could add additional logic here if needed
    }
  }
)

// Combined focus mode extension
export function createFocusModeExtension() {
  return [
    focusModeState,
    focusModeDecorations,
    focusModePlugin
  ]
}