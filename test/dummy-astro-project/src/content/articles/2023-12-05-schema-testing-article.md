---
title: "Complete Schema Field Testing Article"
slug: "schema-testing-comprehensive"
description: "An article specifically designed to test all frontmatter field types and schema validation in the editor"
pubDate: 2023-12-05
updatedDate: 2023-12-10
draft: true
tags: ["schema", "testing", "validation", "frontmatter", "fields", "comprehensive"]
platform: "external"
redirectURL: "https://external-blog.com/schema-testing"
cover: "./styleguide-image.jpg"
coverAlt: "A styleguide image showing various design elements"
styleguide: false
redirectURL: "https://example.com/somewhere
---

# Complete Schema Field Testing Article

This article is specifically designed to test every field type in the articles schema and validate the editor's form generation and validation capabilities.

## Purpose

This content tests:

1. **All field types**: string, boolean, date, array, enum, optional fields
2. **Validation rules**: required vs optional, format validation
3. **Edge cases**: empty arrays, optional fields with and without values
4. **Form generation**: how the editor creates form fields from schema
5. **Data persistence**: how changes are saved and validated

## Field Testing Summary

### Required Fields ✅
- **title**: String field (required) - ✅ Present
- **pubDate**: Date field (required) - ✅ Present and valid

### String Fields
- **title**: "Complete Schema Field Testing Article"
- **slug**: "schema-testing-comprehensive" (optional)
- **description**: Long description field (optional)

### Date Fields
- **pubDate**: Required date with time - 2023-12-05T14:30:00Z
- **updatedDate**: Optional date with time - 2023-12-10T09:15:00Z

### Boolean Fields
- **draft**: true (testing draft functionality)
- **styleguide**: false (testing false boolean values)

### Array Fields
- **tags**: 6 items testing various tag lengths and characters

### Enum Fields
- **platform**: "external" (testing enum selection)

### URL Fields
- **redirectURL**: Testing URL validation

### Image Fields
- **cover**: Local image reference
- **coverAlt**: Associated alt text

## Content for Editor Testing

This article contains various markdown elements to test how the editor handles content while managing frontmatter:

### Basic Formatting

**Bold text**, *italic text*, and `inline code` for basic formatting tests.

### Lists

1. Ordered list item one
2. Ordered list item two
   - Nested unordered item
   - Another nested item
3. Final ordered item

### Code Blocks

```typescript
// TypeScript code block for syntax highlighting testing
interface SchemaField {
  name: string;
  type: 'string' | 'boolean' | 'date' | 'array' | 'enum';
  required: boolean;
  defaultValue?: unknown;
}

const testField: SchemaField = {
  name: 'title',
  type: 'string',
  required: true
};
```

### Blockquotes

> This blockquote tests how the editor handles content formatting while maintaining proper frontmatter separation and validation.

### Links and Images

[External link](https://astro.build) for testing link handling.

![Test image](./styleguide-image.jpg "Test image for editor")

## Validation Testing Notes

This article should trigger various validation scenarios:

1. **Draft status**: Should show draft badge in file list
2. **All field types**: Should generate appropriate form controls
3. **Optional fields**: Should handle empty vs filled optional fields
4. **Array handling**: Should allow adding/removing tags
5. **Date formatting**: Should display dates in user-friendly format
6. **Enum selection**: Should show dropdown for platform field
7. **Image references**: Should handle local image paths
8. **URL validation**: Should validate redirectURL format

## Expected Editor Behavior

When editing this file, the editor should:

- Display all frontmatter fields with appropriate input types
- Show validation errors for malformed data
- Persist changes correctly while maintaining field order
- Handle optional field clearing (setting to empty/null)
- Provide appropriate UI controls for each field type

This comprehensive test ensures the editor can handle real-world content with complex frontmatter schemas.
