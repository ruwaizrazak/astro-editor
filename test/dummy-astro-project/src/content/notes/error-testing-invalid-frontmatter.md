---
title: "Error Testing Note"
pubDate: "invalid-date-format"
sourceURL: "not-a-valid-url"
tags: ["error", "testing", "validation"]
draft: "not-a-boolean"
invalidField: "This field doesn't exist in schema"
---

# Error Testing Note

This note contains intentionally invalid frontmatter to test error handling and validation in the editor.

## Invalid Fields Present

1. **pubDate**: "invalid-date-format" (should be a valid date)
2. **sourceURL**: "not-a-valid-url" (should be a valid URL)
3. **draft**: "not-a-boolean" (should be true/false)
4. **invalidField**: Field not in schema (should be ignored or highlighted)

## Expected Editor Behavior

The editor should:

1. **Show validation errors** for invalid field values
2. **Highlight invalid fields** in the frontmatter panel
3. **Prevent saving** until errors are fixed
4. **Provide helpful error messages** explaining what's wrong
5. **Handle unknown fields** gracefully

## Error Recovery

The editor should allow:
- Fixing invalid dates with a date picker
- Correcting URLs with validation feedback
- Converting string booleans to proper boolean values
- Removing or ignoring unknown fields

This tests the robustness of the frontmatter validation system.
