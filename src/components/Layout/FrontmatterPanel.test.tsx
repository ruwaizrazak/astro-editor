import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrontmatterPanel } from './FrontmatterPanel';
import { useAppStore } from '../../store';

describe('FrontmatterPanel Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentFile: null,
      frontmatter: {},
      collections: [],
      updateFrontmatter: (frontmatter: Record<string, unknown>) => {
        useAppStore.setState({ frontmatter });
      },
    });
  });

  it('should show placeholder when no file is selected', () => {
    render(<FrontmatterPanel />);

    expect(
      screen.getByText('Select a file to edit its frontmatter.')
    ).toBeInTheDocument();
  });

  it('should show frontmatter fields when file is selected', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    const mockFrontmatter = {
      title: 'Test Post',
      draft: false,
      tags: ['test', 'demo'],
      publishDate: '2023-12-01',
      rating: 5,
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: mockFrontmatter,
    });

    render(<FrontmatterPanel />);

    expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test,demo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023-12-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should handle text input changes', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: 'Original Title' },
    });

    render(<FrontmatterPanel />);

    const titleInput = screen.getByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(useAppStore.getState().frontmatter.title).toBe('New Title');
  });

  it('should handle boolean input changes', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { draft: false },
    });

    render(<FrontmatterPanel />);

    const draftCheckbox = screen.getByRole('checkbox');
    expect(draftCheckbox).not.toBeChecked();

    fireEvent.click(draftCheckbox);

    expect(useAppStore.getState().frontmatter.draft).toBe(true);
  });

  it('should handle number input changes', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { rating: 3 },
    });

    render(<FrontmatterPanel />);

    const ratingInput = screen.getByDisplayValue('3');
    fireEvent.change(ratingInput, { target: { value: '5' } });

    expect(useAppStore.getState().frontmatter.rating).toBe(5);
  });

  it('should show message when no frontmatter fields exist', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: {},
    });

    render(<FrontmatterPanel />);

    expect(
      screen.getByText('No frontmatter fields found.')
    ).toBeInTheDocument();
  });

  it('should handle array values as comma-separated strings', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { tags: ['react', 'typescript'] },
    });

    render(<FrontmatterPanel />);

    const tagsInput = screen.getByDisplayValue('react,typescript');
    fireEvent.change(tagsInput, { target: { value: 'vue,javascript' } });

    expect(useAppStore.getState().frontmatter.tags).toEqual([
      'vue',
      'javascript',
    ]);
  });

  it('should use schema information when available', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    const mockCollection = {
      name: 'posts',
      path: '/project/posts',
      schema: JSON.stringify({
        type: 'zod',
        fields: [
          { name: 'title', type: 'String', optional: false },
          { name: 'publishDate', type: 'Date', optional: true },
          { name: 'draft', type: 'Boolean', optional: true },
          { name: 'tags', type: 'Array', optional: true },
        ],
      }),
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: 'Test Post' },
      collections: [mockCollection],
    });

    render(<FrontmatterPanel />);

    // Should show schema indicator
    expect(screen.getByText('Using posts schema')).toBeInTheDocument();

    // Should show all schema fields, even if not in frontmatter
    expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('')).toHaveLength(2); // Date and Array fields have empty values
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // Boolean field
    expect(
      screen.getByPlaceholderText(/tags.*comma-separated/)
    ).toBeInTheDocument(); // Array field

    // Should show optional indicators (3 optional fields: publishDate, draft, tags)
    expect(screen.getAllByText('(optional)')).toHaveLength(3);
    
    // Should show required indicator for title field (1 required field: title)
    expect(screen.getAllByText('*')).toHaveLength(1);
  });

  it('should show validation errors for invalid fields', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    const mockCollection = {
      name: 'posts',
      path: '/project/posts',
      schema: JSON.stringify({
        type: 'zod',
        fields: [{ name: 'title', type: 'String', optional: false }],
      }),
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: '' }, // Empty required field
      collections: [mockCollection],
    });

    render(<FrontmatterPanel />);

    // Should show validation error for empty required field
    expect(screen.getByText('title is required')).toBeInTheDocument();
  });

  it('should show all schema fields even when not in frontmatter', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    const mockCollection = {
      name: 'posts',
      path: '/project/posts',
      schema: JSON.stringify({
        type: 'zod',
        fields: [
          { name: 'title', type: 'String', optional: false },
          { name: 'description', type: 'String', optional: true },
          { name: 'publishDate', type: 'Date', optional: true },
        ],
      }),
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: 'Test Post' }, // Only has title, missing description and publishDate
      collections: [mockCollection],
    });

    render(<FrontmatterPanel />);

    // Should show all schema fields
    expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument(); // title
    expect(
      screen.getByPlaceholderText('description (optional)')
    ).toBeInTheDocument(); // description (empty)

    // Both description and publishDate have empty values, so check for 2 empty inputs
    const emptyInputs = screen.getAllByDisplayValue('');
    expect(emptyInputs).toHaveLength(2); // description and publishDate
  });

  it('should remove field from frontmatter when emptied', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: 'Test Post', description: 'Some description' },
    });

    render(<FrontmatterPanel />);

    const descriptionInput = screen.getByDisplayValue('Some description');
    fireEvent.change(descriptionInput, { target: { value: '' } });

    // Field should be removed from frontmatter when emptied
    const state = useAppStore.getState();
    expect(state.frontmatter).toEqual({ title: 'Test Post' });
    expect(state.frontmatter.description).toBeUndefined();
  });

  it('should remove array field when emptied', () => {
    const mockFile = {
      id: 'posts/test',
      path: '/project/posts/test.md',
      name: 'test',
      extension: 'md',
      is_draft: false,
      collection: 'posts',
    };

    useAppStore.setState({
      currentFile: mockFile,
      frontmatter: { title: 'Test Post', tags: ['react', 'typescript'] },
    });

    render(<FrontmatterPanel />);

    const tagsInput = screen.getByDisplayValue('react,typescript');
    fireEvent.change(tagsInput, { target: { value: '' } });

    // Array field should be removed when emptied
    const state = useAppStore.getState();
    expect(state.frontmatter).toEqual({ title: 'Test Post' });
    expect(state.frontmatter.tags).toBeUndefined();
  });
});
