import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoGrowingInput } from './auto-growing-input';

describe('AutoGrowingInput Component', () => {
  it('should render with initial value', () => {
    render(<AutoGrowingInput value="Test content" onChange={() => {}} />);
    
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
  });

  it('should handle text changes', () => {
    let value = 'Initial';
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      value = e.target.value;
    };

    render(<AutoGrowingInput value={value} onChange={handleChange} />);
    
    const textarea = screen.getByDisplayValue('Initial');
    fireEvent.change(textarea, { target: { value: 'Updated content' } });
    
    expect(value).toBe('Updated content');
  });

  it('should apply custom className', () => {
    render(
      <AutoGrowingInput 
        value="" 
        onChange={() => {}} 
        className="custom-class"
        data-testid="auto-input"
      />
    );
    
    const textarea = screen.getByTestId('auto-input');
    expect(textarea).toHaveClass('custom-class');
  });

  it('should show placeholder text', () => {
    render(
      <AutoGrowingInput 
        value="" 
        onChange={() => {}} 
        placeholder="Enter title..."
      />
    );
    
    expect(screen.getByPlaceholderText('Enter title...')).toBeInTheDocument();
  });

  it('should start with single row', () => {
    render(
      <AutoGrowingInput 
        value="" 
        onChange={() => {}} 
        data-testid="auto-input"
      />
    );
    
    const textarea = screen.getByTestId('auto-input');
    expect(textarea).toHaveAttribute('rows', '1');
  });

  it('should have resize-none and overflow-hidden classes', () => {
    render(
      <AutoGrowingInput 
        value="" 
        onChange={() => {}} 
        data-testid="auto-input"
      />
    );
    
    const textarea = screen.getByTestId('auto-input');
    expect(textarea).toHaveClass('resize-none', 'overflow-hidden');
  });
});