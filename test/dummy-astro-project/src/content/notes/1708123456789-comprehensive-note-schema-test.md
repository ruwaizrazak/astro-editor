---
title: "Comprehensive Note Schema Testing"
slug: "note-schema-comprehensive-test"
description: "A note that tests all available fields in the notes schema for comprehensive validation"
pubDate: 2024-02-16
sourceURL: "https://example.com/source-article"
tags: ["testing", "schema", "notes", "validation", "comprehensive"]
draft: true
---

# Comprehensive Note Schema Testing

This note is designed to test every field available in the notes collection schema.

## Schema Fields Tested

### Required Fields ✅
- **title**: String field (required)
- **pubDate**: Date field (required)

### Optional Fields ✅
- **slug**: Custom URL slug
- **description**: Longer description for SEO/previews
- **sourceURL**: External link to source material
- **tags**: Array of categorization tags
- **draft**: Boolean flag for draft status
- **styleguide**: Boolean flag for styleguide content

## Source Material

This note references external content via the `sourceURL` field, which is useful for:

1. **Link blogs**: Commenting on external articles
2. **Reference notes**: Quick thoughts about other content
3. **Research notes**: Tracking source materials
4. **Bookmarks**: Enhanced bookmarking with commentary

## Content Types

Notes can contain various markdown elements:

### Lists
- Quick bullet points
- Simple thoughts
- Reference links

### Quotes
> "Notes should capture thoughts quickly without heavy formatting requirements"

### Simple Code
Use `inline code` for quick technical references.

```bash
# Quick command references
npm run dev
```

## Testing Expectations

This note should:

1. **Show draft badge** (draft: true)
2. **Display all form fields** when editing
3. **Handle optional fields** properly
4. **Validate sourceURL** as proper URL
5. **Support tag management** with add/remove functionality
6. **Maintain schema compliance** during editing

The notes collection is designed for simpler, quicker content capture compared to full articles, but should still support rich frontmatter when needed.
