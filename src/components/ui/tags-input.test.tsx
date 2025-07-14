import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagsInput } from './tags-input';

describe('TagsInput Component', () => {
  it('should render with empty tags', () => {
    render(<TagsInput value={[]} onChange={() => {}} />);
    
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('should display existing tags as badges', () => {
    render(<TagsInput value={['react', 'typescript']} onChange={() => {}} />);
    
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('should add tag on Enter key', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(tags).toEqual(['newtag']);
  });

  it('should add tag on comma key', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: ',' });
    
    expect(tags).toEqual(['newtag']);
  });

  it('should add tag on blur', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.blur(input);
    
    expect(tags).toEqual(['newtag']);
  });

  it('should remove tag when X button is clicked', () => {
    let tags = ['react', 'typescript'];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    // Find the remove button for the first tag
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);
    
    expect(tags).toEqual(['typescript']);
  });

  it('should not add duplicate tags', () => {
    let tags = ['react'];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(tags).toEqual(['react']); // Should not add duplicate
  });

  it('should trim whitespace from tags', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  spaced  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(tags).toEqual(['spaced']);
  });

  it('should not add empty tags', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(tags).toEqual([]);
  });

  it('should remove last tag on backspace when input is empty', () => {
    let tags = ['react', 'typescript'];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    // Input should be empty, then press backspace
    fireEvent.keyDown(input, { key: 'Backspace' });
    
    expect(tags).toEqual(['react']);
  });

  it('should use custom placeholder', () => {
    render(
      <TagsInput 
        value={[]} 
        onChange={() => {}} 
        placeholder="Custom placeholder"
      />
    );
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should clear input after adding tag', () => {
    let tags: string[] = [];
    const handleChange = (newTags: string[]) => {
      tags = newTags;
    };

    render(<TagsInput value={tags} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect((input as HTMLInputElement).value).toBe('');
  });
});