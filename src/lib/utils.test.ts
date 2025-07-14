import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils - cn function', () => {
  it('should combine basic class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const condition1 = true;
    const condition2 = false;
    expect(
      cn('base', condition1 && 'conditional', condition2 && 'hidden')
    ).toBe('base conditional');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('should merge conflicting Tailwind classes', () => {
    // tailwind-merge should prioritize the last conflicting class
    expect(cn('px-4', 'px-2')).toBe('px-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle complex conditional logic', () => {
    // Test with different combinations
    const getButtonClasses = (
      variant: string,
      size: string,
      disabled: boolean
    ) => {
      return cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        disabled && 'btn-disabled',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg'
      );
    };

    expect(getButtonClasses('primary', 'lg', false)).toBe(
      'btn btn-primary btn-lg'
    );
    expect(getButtonClasses('secondary', 'sm', true)).toBe(
      'btn btn-secondary btn-disabled btn-sm'
    );
    expect(getButtonClasses('other', 'md', false)).toBe('btn');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined, null, false)).toBe('');
  });

  it('should work with array inputs', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle object inputs for conditional classes', () => {
    expect(
      cn({
        base: true,
        active: true,
        hidden: false,
        large: true,
      })
    ).toBe('base active large');
  });
});
