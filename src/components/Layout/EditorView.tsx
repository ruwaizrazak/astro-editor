import React, { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAppStore } from '../../store';
import './EditorView.css';

export const EditorView: React.FC = () => {
  const { editorContent, setEditorContent, currentFile } = useAppStore();

  const onChange = useCallback((value: string) => {
    setEditorContent(value);
  }, [setEditorContent]);

  // For now, use a simple theme - we'll create iA Writer theme later
  const extensions = [markdown()];

  return (
    <div className="editor-view">
      <CodeMirror
        value={editorContent}
        onChange={onChange}
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