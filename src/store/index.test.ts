import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      projectPath: null,
      collections: [],
      sidebarVisible: true,
      frontmatterPanelVisible: true,
      currentFile: null,
      files: [],
      selectedCollection: null,
      editorContent: '',
      isDirty: false,
    });
    globalThis.mockTauri.reset();
  });

  it('should initialize with default state', () => {
    const state = useAppStore.getState();
    expect(state.projectPath).toBeNull();
    expect(state.collections).toEqual([]);
    expect(state.sidebarVisible).toBe(true);
    expect(state.frontmatterPanelVisible).toBe(true);
    expect(state.editorContent).toBe('');
    expect(state.isDirty).toBe(false);
  });

  it('should set project path', () => {
    const { setProject } = useAppStore.getState();
    setProject('/test/project/path');

    const state = useAppStore.getState();
    expect(state.projectPath).toBe('/test/project/path');
  });

  it('should toggle sidebar visibility', () => {
    const { toggleSidebar } = useAppStore.getState();

    expect(useAppStore.getState().sidebarVisible).toBe(true);
    toggleSidebar();
    expect(useAppStore.getState().sidebarVisible).toBe(false);
    toggleSidebar();
    expect(useAppStore.getState().sidebarVisible).toBe(true);
  });

  it('should toggle frontmatter panel visibility', () => {
    const { toggleFrontmatterPanel } = useAppStore.getState();

    expect(useAppStore.getState().frontmatterPanelVisible).toBe(true);
    toggleFrontmatterPanel();
    expect(useAppStore.getState().frontmatterPanelVisible).toBe(false);
    toggleFrontmatterPanel();
    expect(useAppStore.getState().frontmatterPanelVisible).toBe(true);
  });

  it('should set editor content and mark as dirty', () => {
    const { setEditorContent } = useAppStore.getState();

    setEditorContent('# Test Content');

    const state = useAppStore.getState();
    expect(state.editorContent).toBe('# Test Content');
    expect(state.isDirty).toBe(true);
  });

  it('should set selected collection', () => {
    const { setSelectedCollection } = useAppStore.getState();

    setSelectedCollection('blog');
    expect(useAppStore.getState().selectedCollection).toBe('blog');

    setSelectedCollection(null);
    expect(useAppStore.getState().selectedCollection).toBeNull();
  });
});
