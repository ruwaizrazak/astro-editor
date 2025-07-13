import React, { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { useAppStore } from '../../store';
import './EditorView.css';

export const EditorViewComponent: React.FC = () => {
  const { editorContent, setEditorContent, currentFile, saveFile, isDirty } =
    useAppStore();
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const onChange = useCallback(
    (value: string) => {
      setEditorContent(value);

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new auto-save timeout (30 seconds)
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        if (currentFile && isDirty) {
          void saveFile();
        }
      }, 30000);
    },
    [setEditorContent, saveFile, currentFile, isDirty]
  );

  // Auto-save on blur (when editor loses focus)
  const handleBlur = useCallback(() => {
    if (currentFile && isDirty) {
      void saveFile();
    }
  }, [saveFile, currentFile, isDirty]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced extensions for better writing experience
  const extensions = [
    markdown(),
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      // Custom markdown shortcuts
      {
        key: 'Mod-b',
        run: () => {
          // Bold shortcut - will implement markdown formatting
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: () => {
          // Italic shortcut - will implement markdown formatting
          return true;
        },
      },
      {
        key: 'Mod-k',
        run: () => {
          // Link shortcut - will implement markdown link creation
          return true;
        },
      },
      {
        key: 'Mod-s',
        run: () => {
          // Save shortcut
          if (currentFile && isDirty) {
            void saveFile();
          }
          return true;
        },
      },
    ]),
    EditorView.theme({
      '&': {
        fontSize: '16px',
        fontFamily:
          '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      '.cm-content': {
        padding: '20px 40px',
        lineHeight: '1.6',
        minHeight: '100vh',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '0',
      },
      '.cm-scroller': {
        fontVariantLigatures: 'common-ligatures',
      },
      // Markdown-specific styling
      '.cm-line': {
        maxWidth: '65ch',
        margin: '0 auto',
      },
      // Heading styles with hanging hash marks (basic implementation)
      '.tok-heading1': {
        fontSize: '2em',
        fontWeight: 'bold',
        lineHeight: '1.2',
      },
      '.tok-heading2': {
        fontSize: '1.5em',
        fontWeight: 'bold',
        lineHeight: '1.3',
      },
      '.tok-heading3': {
        fontSize: '1.25em',
        fontWeight: 'bold',
        lineHeight: '1.4',
      },
      '.tok-strong': {
        fontWeight: '600',
      },
      '.tok-emphasis': {
        fontStyle: 'italic',
      },
      '.tok-strikethrough': {
        textDecoration: 'line-through',
      },
      '.tok-link': {
        color: '#007AFF',
        textDecoration: 'none',
      },
      '.tok-url': {
        color: '#8E8E93',
      },
      '.tok-monospace': {
        fontFamily:
          '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '0.9em',
        backgroundColor: 'rgba(142, 142, 147, 0.12)',
        padding: '2px 4px',
        borderRadius: '3px',
      },
    }),
    EditorView.lineWrapping,
  ];

  return (
    <div className="editor-view">
      <CodeMirror
        value={editorContent}
        onChange={onChange}
        onBlur={handleBlur}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
        className="editor-codemirror"
      />
    </div>
  );
};
