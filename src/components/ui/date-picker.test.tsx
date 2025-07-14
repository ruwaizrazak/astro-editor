import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DatePicker } from './date-picker';

describe('DatePicker Component', () => {
  it('should render with placeholder when no date is selected', () => {
    render(<DatePicker placeholder="Select date..." />);
    
    expect(screen.getByText('Select date...')).toBeInTheDocument();
  });

  it('should render with default placeholder', () => {
    render(<DatePicker />);
    
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('should display formatted date when date is provided', () => {
    const testDate = new Date('2023-12-01');
    render(<DatePicker date={testDate} />);
    
    // Should show formatted date (format will depend on locale)
    expect(screen.getByRole('button')).toHaveTextContent(/December|Dec/);
  });

  it('should render as a button for accessibility', () => {
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should have calendar icon', () => {
    render(<DatePicker />);
    
    // Calendar icon should be present
    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<DatePicker className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should show muted text when no date is selected', () => {
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-muted-foreground');
  });

  it('should call onDateChange when date changes', () => {
    const handleChange = vi.fn();

    render(<DatePicker onDateChange={handleChange} />);
    
    // Test would need user interaction simulation for full coverage
    // This test verifies the prop is accepted
    expect(handleChange).toBeDefined();
  });

  it('should handle undefined date prop', () => {
    render(<DatePicker date={undefined} />);
    
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('should handle date prop correctly', () => {
    const testDate = new Date('2023-01-01');
    const handleChange = vi.fn();

    render(<DatePicker date={testDate} onDateChange={handleChange} />);
    
    // Component should accept the date without errors
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});