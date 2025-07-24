# Task: Hanging Headers

https://github.com/dannysmith/astro-editor/issues/3

Implement hanging headers in the markdown editor, displaying heading indicators (#, ##, ###) in the left margin similar to iA Writer's design.

## Overview

Add visual heading indicators that appear in the editor's left margin/gutter area. These indicators should show the heading level (# for H1, ## for H2, ### for H3, etc.) aligned with their corresponding heading lines in the document.

## Requirements

- Display heading indicators (#, ##, ###) in the left margin of the editor
- Indicators should be visually distinct but subtle (likely gray/muted color)
- Align indicators precisely with their corresponding heading lines
- Support all markdown heading levels (H1-H6)
- Indicators should update dynamically as the user types or modifies headings
- Maintain clean visual hierarchy without cluttering the editor interface

## User Experience

When users write markdown headings, they should see the heading level indicators appear automatically in the left margin. This provides:

- Quick visual reference for document structure
- Easy identification of heading levels at a glance
- Enhanced writing experience similar to iA Writer

## Reference

The implementation should follow the visual style demonstrated in iA Writer, where heading indicators are displayed in a dedicated gutter area to the left of the main text content.
